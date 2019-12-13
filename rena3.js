/*
 * This source code is under the Unlicense
 */
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

        letrec: function(/* args */) {
            var l = Array.prototype.slice.call(arguments),
                i,
                res;

            res = (function(g) {
                return g(g);
            })(function(p) {
                var i,
                    li,
                    res = [];
                for(i = 0; i < l.length; i++) {
                    (function (li) {
                        res.push(function(str, index, captures) {
                            return (wrap(li.apply(null, p(p))))(str, index, captures);
                        });
                    })(l[i]);
                }
                return res;
            });
            return res[0];
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

        lookahead: function(exp) {
            return me.lookaheadNot(me.lookaheadNot(exp));
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
        }
    };
    return me;
}
