/*
 * This source code is under the Unlicense
 */
function Rena(option) {
    const optIgnore = option ? wrap(option.ignore) : null;
    const optKeys = option ? option.keys : null;
    const concatNotSkip = concat0((match, index) => index);
    const patternFloat = /[\+\-]?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)(?:[eE][\+\-]?[0-9]+)?/;

    function wrap(anObject) {
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
            const reSource = anObject.source;
            const reFlags = "g" + (anObject.ignoreCase ? "i" : "") + (anObject.multiline ? "m" : "");
            const regex = new RegExp(reSource, reFlags);

            return function(match0, lastindex, attr) {
                regex.lastIndex = 0;
                const match = regex.exec(match0.substring(lastindex));

                if(match && match.index === 0) {
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

    function defaultSkipSpace(match, index) {
        if(!optIgnore) {
            return index;
        } else {
            const result = optIgnore(match, index, null);

            return result ? result.lastIndex : index;
        }
    }

    function concat0(skipSpace) {
        return function(...args0) {
            const args = args0.map(x => wrap(x));

            return function(match, index, attr) {
                let indexNew = index;
                let attrNew = attr;

                for(let i = 0; i < args.length; i++) {
                    const result = args[i](match, indexNew, attrNew);

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

    const me = {
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

        choice: function(...args0) {
            const args = args0.map(x => wrap(x));

            return function(match, index, attr) {
                for(let i = 0; i < args.length; i++) {
                    const result = args[i](match, index, attr);

                    if(result) {
                        return result;
                    }
                }
                return null;
            };
        },

        action: function(exp, action) {
            const wrapped = wrap(exp);

            return function(match, index, attr) {
                const result = wrapped(match, index, attr);

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
            const wrapped = wrap(exp);

            return function(match, index, attr) {
                const result = wrapped(match, index, attr);

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
            const wrapped = wrap(exp);

            return function(match, index, attr) {
                const result = wrapped(match, index, attr);

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

        letrec: function(...l) {
            const delays = [];
            const memo = [];

            for(let i = 0; i < l.length; i++) {
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
            return me.letrec(y => me.choice(me.concat(exp, y), ""));
        },

        oneOrMore: function(exp) {
            return me.concat(exp, me.zeroOrMore(exp));
        },

        opt: function(exp) {
            return me.choice(exp, "");
        },

        attr: function(val) {
            return me.action("", () => val);
        },

        real: function(val) {
            return me.action(patternFloat, match => parseFloat(match));
        },

        key: function(key) {
            if(!optKeys) {
                throw new Error("keys are not set");
            }
            const skipKeys = optKeys.filter(k => key.length < k.length && key === k.substring(0, key.length));
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

