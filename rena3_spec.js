/*
 * This source code is under the Unlicense
 */
/*
 * This test case is described for Jasmine.
 */
describe("Rena3", function () {
    function match(pattern, string, match, lastIndex) {
        var result = pattern(string, 0, false);
        expect(result.match).toBe(match);
        expect(result.lastIndex).toBe(lastIndex);
    }

    function matchAttr(pattern, string, match, lastIndex, attr) {
        var result = pattern(string, 0, false);
        expect(result.match).toBe(match);
        expect(result.lastIndex).toBe(lastIndex);
        expect(result.attr).toBe(attr);
    }

    function nomatch(pattern, string) {
        expect(pattern(string, 0, false)).toBeNull();
    }

    function throwErrchoice(patternThunk) {
        try {
            patternThunk();
            fail();
        } catch(e) {
            // ok
        }
    }

    function fntest(str, index, attr) {
        if(str.charAt(index) === "a") {
            return {
                match: "a",
                lastIndex: index + 1,
                attr: attr
            };
        } else {
            return null;
        }
    }

    beforeEach(function () {
    });

    describe("testing match", function () {
        it("simple string match", function () {
            var r = Rena();
            match(r.concat("string"), "string", "string", 6);
            match(r.concat("string"), "strings", "string", 6);
            nomatch(r.concat("string"), "strin");
            match(r.concat(""), "string", "", 0);
        });

        it("simple regex match", function () {
            var r = Rena();
            match(Rena().concat(/[0-9]+/), "765", "765", 3);
            match(Rena().concat(/[0-9]+/), "765AS", "765", 3);
            nomatch(Rena().concat(/[0-9]+/), "strin");
        });

        it("simple function match", function () {
            var r = Rena();
            match(r.concat(fntest), "a", "a", 1);
            nomatch(r.concat(fntest), "s");
        });

        it("chaining concat", function () {
            var r = Rena();
            var ptn = r.concat("string", "match");
            match(ptn, "stringmatch", "stringmatch", 11);
            match(ptn, "stringmatches", "stringmatch", 11);
            nomatch(ptn, "stringmatc");
            nomatch(ptn, "strinmatch");
        });

        it("isEnd", function () {
            match(Rena().concat("765", Rena().isEnd()), "765", "765", 3);
            nomatch(Rena().concat("765", Rena().isEnd()), "765961");
            match(Rena().isEnd(), "", "", 0);
        });

        it("equalsId", function () {
            var q1 = Rena({ ignore: /\s+/ }),
                q2 = Rena({ keys: ["+", "++", "-"] }),
                q3 = Rena({ ignore: /\s+/, keys: ["+", "++", "-"] });
            match(Rena().equalsId("if"), "if", "if", 2);
            match(Rena().equalsId("if"), "if ", "if", 2);
            match(Rena().equalsId("if"), "iff", "if", 2);
            match(q1.equalsId("if"), "if", "if", 2);
            match(q1.equalsId("if"), "if ", "if", 2);
            nomatch(q1.equalsId("if"), "iff");
            nomatch(q1.equalsId("if"), "if+");
            match(q2.equalsId("if"), "if", "if", 2);
            match(q2.equalsId("if"), "if+", "if", 2);
            match(q2.equalsId("if"), "if++", "if", 2);
            match(q2.equalsId("if"), "if-", "if", 2);
            nomatch(q2.equalsId("if"), "if ");
            nomatch(q2.equalsId("if"), "iff");
            match(q3.equalsId("if"), "if", "if", 2);
            match(q3.equalsId("if"), "if ", "if", 2);
            match(q3.equalsId("if"), "if+", "if", 2);
            match(q3.equalsId("if"), "if++", "if", 2);
            match(q3.equalsId("if"), "if-", "if", 2);
            nomatch(q3.equalsId("if"), "iff");
        });

        it("real", function () {
            var r = Rena();
            function assertReal(str) {
                var matcher = r.real();
                return matcher(str, 0, false);
            }
            expect(assertReal("765").attr).toBe(765);
            expect(assertReal("76.5").attr).toBe(76.5);
            expect(assertReal("0.765").attr).toBe(0.765);
            expect(assertReal(".765").attr).toBe(0.765);
            expect(assertReal("765e2").attr).toBe(76500);
            expect(assertReal("765E2").attr).toBe(76500);
            expect(assertReal("765e+2").attr).toBe(76500);
            expect(assertReal("765e-2").attr).toBe(7.65);
            expect(assertReal("765e+346").attr).toBe(Infinity);
            expect(assertReal("765e-346").attr).toBe(0);
            expect(assertReal("a961")).toBeNull();
            expect(assertReal("+765").attr).toBe(765);
            expect(assertReal("+76.5").attr).toBe(76.5);
            expect(assertReal("+0.765").attr).toBe(0.765);
            expect(assertReal("+.765").attr).toBe(0.765);
            expect(assertReal("+765e2").attr).toBe(76500);
            expect(assertReal("+765E2").attr).toBe(76500);
            expect(assertReal("+765e+2").attr).toBe(76500);
            expect(assertReal("+765e-2").attr).toBe(7.65);
            expect(assertReal("+765e+346").attr).toBe(Infinity);
            expect(assertReal("+765e-346").attr).toBe(0);
            expect(assertReal("+a961")).toBeNull();
            expect(assertReal("-765").attr).toBe(-765);
            expect(assertReal("-76.5").attr).toBe(-76.5);
            expect(assertReal("-0.765").attr).toBe(-0.765);
            expect(assertReal("-.765").attr).toBe(-0.765);
            expect(assertReal("-765e2").attr).toBe(-76500);
            expect(assertReal("-765E2").attr).toBe(-76500);
            expect(assertReal("-765e+2").attr).toBe(-76500);
            expect(assertReal("-765e-2").attr).toBe(-7.65);
            expect(assertReal("-765e+346").attr).toBe(-Infinity);
            expect(assertReal("-765e-346").attr).toBe(0);
            expect(assertReal("-a961")).toBeNull();
        });

        it("choice", function () {
            var ptn = Rena().choice("string", /[0-9]+/, fntest);
            match(ptn, "string", "string", 6);
            match(ptn, "765", "765", 3);
            match(ptn, "a", "a", 1);
            nomatch(ptn, "-");
        });

        it("opt", function () {
            match(Rena().opt("string"), "string", "string", 6);
            match(Rena().opt("string"), "strings", "string", 6);
            match(Rena().opt("string"), "strin", "", 0);
            match(Rena().opt("string"), "stringstring", "string", 6);
        });

        it("oneOrMore", function () {
            match(Rena().oneOrMore("str"), "str", "str", 3);
            match(Rena().oneOrMore("str"), "strstrstrstrstr", "strstrstrstrstr", 15);
            nomatch(Rena().oneOrMore("str"), "");
        });

        it("zeroOrMore", function () {
            match(Rena().zeroOrMore("str"), "", "", 0);
            match(Rena().zeroOrMore("str"), "str", "str", 3);
            match(Rena().zeroOrMore("str"), "strstrstrstrstr", "strstrstrstrstr", 15);
        });

        it("lookahead", function () {
            match(Rena().concat(Rena().lookahead(/[0-9]+pro/), /[0-9]+/), "765pro", "765", 3);
            match(Rena().concat(/[0-9]+/, Rena().lookahead("pro")), "765pro", "765", 3);
            nomatch(Rena().concat(Rena().lookahead(/[0-9]+pro/), /[0-9]+/), "765studio");
            nomatch(Rena().concat(/[0-9]+/, Rena().lookahead("pro")), "765studio");
            nomatch(Rena().concat(/[0-9]+/, Rena().lookahead("pro")), "765");
            match(Rena().concat(Rena().lookahead(/[0-9]+pro/), /[0-9]+/), "765pro", "765", 3);
            match(Rena().concat(/[0-9]+/, Rena().lookahead("pro")), "765pro", "765", 3);
            nomatch(Rena().concat(/[0-9]+/, Rena().lookahead("pro")), "765studio");
        });

        it("lookaheadNot", function () {
            match(Rena().concat(Rena().lookaheadNot(/[0-9]+pro/), /[0-9]+/), "765studio", "765", 3);
            match(Rena().concat(/[0-9]+/, Rena().lookaheadNot("pro")), "765studio", "765", 3);
            match(Rena().concat(/[0-9]+/, Rena().lookaheadNot("pro")), "765", "765", 3);
            nomatch(Rena().concat(Rena().lookaheadNot(/[0-9]+pro/), /[0-9]+/), "765pro");
            nomatch(Rena().concat(/[0-9]+/, Rena().lookaheadNot("pro")), "765pro");
            match(Rena().concat(Rena().lookaheadNot(/[0-9]+pro/), /[0-9]+/), "765studio", "765", 3);
        });

        it("key", function () {
            var q = Rena({ keys: ["*", "+", "++"] });
            match(q.key("+"), "+", "+", 1);
            match(q.key("++"), "++", "++", 2);
            match(q.key("*"), "*", "*", 1);
        });

        it("notKey", function () {
            var q = Rena({ keys: ["*", "+", "++"] });
            match(q.notKey(), "/", "", 0);
            nomatch(q.notKey(), "+");
            nomatch(q.notKey(), "++");
            nomatch(q.notKey(), "*");
        });

        it("skip space", function () {
            var r = Rena({ ignore: /\s+/ });
            match(r.concat("765", "pro"), "765pro", "765pro", 6);
            match(r.concat("765", "pro"), "765  pro", "765  pro", 8);
            nomatch(r.concat("765", "pro"), "76 5pro");
        });

        it("letrec", function () {
            var r = Rena(),
                ptn1;
            function assertParse(str) {
                return ptn1(str, 0, 0);
            }

            ptn1 = r.letrec(function(t, f, e) {
                return r.concat(f, r.zeroOrMore(r.choice(
                    r.action(r.concat("+", f), function(x, a, b) { return b + a; }),
                    r.action(r.concat("-", f), function(x, a, b) { return b - a; }))))
            }, function(t, f, e) {
                return r.concat(e, r.zeroOrMore(r.choice(
                    r.action(r.concat("*", e), function(x, a, b) { return b * a; }),
                    r.action(r.concat("/", e), function(x, a, b) { return b / a; }))))
            }, function(t, f, e) {
                return r.choice(r.real(), r.concat("(", t, ")"))
            });
            expect(assertParse("1+2*3").attr).toBe(7);
            expect(assertParse("(1+2)*3").attr).toBe(9);
            expect(assertParse("4-6/2").attr).toBe(1);
            expect(assertParse("1+2+3*3").attr).toBe(12);
        });
    });
});
