/*
 * This source code is under the Unlicense
 */
(function(root) {
    function Rena(option) {
        var optIgnore = option ? wrap(option.ignore) : null,
            optKeys = option ? option.keys : null,
            concatNotSkip = concat0(function(match, index) { return index; }),
            patternFloat = /[\+\-]?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)(?:[eE][\+\-]?[0-9]+)?/,
            me;

        function wrap(anObject) {
            var regex,
                reSource,
                reFlags = "g";

            if(typeof anObject === "string") {
                return function(match, index, attr) {
                    if(anObject === match.substring(index, index + anObject.length)) {
                        return {
                            match: anObject,
                            lastIndex: index + anObject.length,
                            attr: attr
                        };
                    } else {
                        return null;
                    }
                };
            } else if(anObject instanceof RegExp) {
                reSource = anObject.source;
                reFlags += anObject.ignoreCase ? "i" : "";
                reFlags += anObject.multiline ? "m" : "";
                regex = new RegExp(reSource, reFlags);
                return function(match, lastindex, attr) {
                    var match;
                    regex.lastIndex = 0;
                    if(!!(match = regex.exec(match.substring(lastindex))) && match.index === 0) {
                        return {
                            match: match[0],
                            lastIndex: lastindex + regex.lastIndex,
                            attr: attr
                        };
                    } else {
                        return null;
                    }
                };
            } else {
                return anObject;
            }
        }

        function wrapObjects(objects) {
            var result = [], i;

            for(i = 0; i < objects.length; i++) {
                result.push(wrap(objects[i]));
            }
            return result;
        }

        function defaultSkipSpace(match, index) {
            var result;

            if(!optIgnore || !(result = optIgnore(match, index, null))) {
                return index;
            } else {
                return result.lastIndex;
            }
        }

        function concat0(skipSpace) {
            return function(/* args */) {
                var args = wrapObjects(Array.prototype.slice.call(arguments));

                return function(match, index, attr) {
                    var indexNew = index,
                        attrNew = attr,
                        result,
                        i;

                    for(i = 0; i < args.length; i++) {
                        result = args[i](match, indexNew, attrNew);
                        if(result) {
                            indexNew = skipSpace(match, result.lastIndex);
                            attrNew = result.attr;
                        } else {
                            return null;
                        }
                    }
                    return {
                        match: match.substring(index, indexNew),
                        lastIndex: indexNew,
                        attr: attrNew
                    };
                };
            };
        }

        me = {
            isEnd: function() {
                return function(match, index, attr) {
                    if(index >= match.length) {
                        return {
                            match: "",
                            lastIndex: index,
                            attr: attr
                        };
                    } else {
                        return null;
                    }
                };
            },

            concat: concat0(defaultSkipSpace),

            choice: function(/* args */) {
                var args = wrapObjects(Array.prototype.slice.call(arguments));

                return function(match, index, attr) {
                    var result, i;

                    for(i = 0; i < args.length; i++) {
                        result = args[i](match, index, attr);
                        if(result) {
                            return result;
                        }
                    }
                    return null;
                };
            },

            action: function(exp, action) {
                var wrapped = wrap(exp);

                return function(match, index, attr) {
                    var result = wrapped(match, index, attr);

                    if(result) {
                        return {
                            match: result.match,
                            lastIndex: result.lastIndex,
                            attr: action(result.match, result.attr, attr)
                        };
                    } else {
                        return null;
                    }
                };
            },

            lookaheadNot: function(exp) {
                var wrapped = wrap(exp);

                return function(match, index, attr) {
                    var result = wrapped(match, index, attr);

                    if(result) {
                        return null;
                    } else {
                        return {
                            match: "",
                            lastIndex: index,
                            attr: attr
                        };
                    }
                };
            },

            lookahead: function(exp) {
                var wrapped = wrap(exp);

                return function(match, index, attr) {
                    var result = wrapped(match, index, attr);

                    if(result) {
                        return {
                            match: "",
                            lastIndex: index,
                            attr: result.attr
                        };
                    } else {
                        return null;
                    }
                };
            },

            letrec: function(/* args */) {
                var l = Array.prototype.slice.call(arguments),
                    delays = [],
                    memo = [],
                    i;

                for(i = 0; i < l.length; i++) {
                    (function(i) {
                        delays.push(function(match, index, attr) {
                            if(!memo[i]) {
                                memo[i] = l[i].apply(null, delays);
                            }
                            return memo[i](match, index, attr);
                        });
                    })(i);
                }
                return delays[0];
            },

            zeroOrMore: function(exp) {
                return me.letrec(function(y) {
                    return me.choice(me.concat(exp, y), "");
                });
            },

            oneOrMore: function(exp) {
                return me.concat(exp, me.zeroOrMore(exp));
            },

            opt: function(exp) {
                return me.choice(exp, "");
            },

            attr: function(val) {
                return me.action("", function() { return val; });
            },

            real: function(val) {
                return me.action(patternFloat, function(match) { return parseFloat(match); });
            },

            key: function(key) {
                var skipKeys = [],
                    i;

                if(!optKeys) {
                    throw new Error("keys are not set");
                }
                for(i = 0; i < optKeys.length; i++) {
                    if(key.length < optKeys[i] && key === optKeys[i].substring(0, key.length)) {
                        skipKeys.push(optKeys[i]);
                    }
                }
                return me.concat(me.lookaheadNot(me.choice.apply(null, skipKeys)), key);
            },

            notKey: function() {
                if(!optKeys) {
                    throw new Error("keys are not set");
                }
                return me.lookaheadNot(me.choice.apply(null, optKeys));
            },

            equalsId: function(key) {
                if(!optIgnore && !optKeys) {
                    return wrap(key);
                } else if(optIgnore && !optKeys) {
                    return concatNotSkip(key, me.choice(me.isEnd(), me.lookahead(optIgnore)));
                } else if(optKeys && !optIgnore) {
                    return concatNotSkip(key, me.choice(me.isEnd(), me.lookaheadNot(me.notKey())));
                } else {
                    return concatNotSkip(key, me.choice(me.isEnd(), me.lookahead(optIgnore), me.lookaheadNot(me.notKey())));
                }
            },

            stringBack: function(aString) {
                return function(match, index, attr) {
                    if(index < aString.length) {
                        return null;
                    } else if(aString === match.substring(index - aString.length, index)) {
                        return {
                            match: aString,
                            lastIndex: index - aString.length,
                            attr: attr
                        };
                    } else {
                        return null;
                    }
                };
            },

            lookbehindString: function(aString) {
                return me.lookahead(me.stringBack(aString));
            },

            move: function(indexNew) {
                if(typeof indexNew !== "number" || indexNew < 0) {
                    throw new Error("index must be non-negative number");
                }
                return function(match, index, attr) {
                    return {
                        match: "",
                        lastIndex: indexNew > match.length ? match.length : indexNew,
                        attr: attr
                    };
                };
            },

            moveRelational: function(indexRel) {
                return function(match, index, attr) {
                    var indexNew = index + indexRel;

                    return {
                        match: "",
                        lastIndex: indexNew < 0 ? 0 : indexNew > match.length ? match.length : indexNew,
                        attr: attr
                    };
                };
            },

            moveEnd: function() {
                return function(match, index, attr) {
                    return {
                        match: "",
                        lastIndex: match.length,
                        attr: attr
                    };
                };
            }
        };
        return me;
    }

    if(typeof module !== "undefined" && module.exports) {
        module.exports = Rena;
    } else {
        root["Rena"] = Rena;
    }
})(this);
