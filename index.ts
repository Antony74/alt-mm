import checkmm, { Assertion, Expression } from 'checkmm';

interface AssertionInfo {
    labels: string[];
    hypothesesExpressionText: string[];
    disjvarText: string[];
    conclusionExpressionText: string;
}

interface LabelledAssertion {
    label: string;
    assertion: Assertion;
}

const assertionsAreEqual = (a1: AssertionInfo, a2: AssertionInfo) => {
    return (
        a1.conclusionExpressionText === a2.conclusionExpressionText &&
        checkmm.std.arraysequal(a1.hypothesesExpressionText, a2.hypothesesExpressionText) &&
        checkmm.std.arraysequal(a1.disjvarText, a2.disjvarText)
    );
};

// const getHypotheses = (a: Assertion): string[] => {
//     return a.hypotheses.map(label => checkmm.hypotheses.get(label)!.first.join(' '));
// };

// const assertionsAreEqual = (a1: Assertion, a2: Assertion): boolean => {
//     // Compare expressions
//     const expressionsEqual = checkmm.std.arraysequal(a1.expression, a2.expression);
//     if (!expressionsEqual) {
//         return false;
//     }

//     // Compare hypotheses
//     const hypothesesEqual = checkmm.std.arraysequal(getHypotheses(a1).sort(), getHypotheses(a2).sort());
//     if (!hypothesesEqual) {
//         return false;
//     }

//     // Compare disjoint variables
//     const disjvars = new Set(a1.disjvars);
//     let missingDisjvar = false;
//     a2.disjvars.forEach(disjvar => {
//         missingDisjvar &&= disjvars.delete(disjvar);
//     });

//     if (missingDisjvar || disjvars.size) {
//         return false;
//     }

//     return true;
// };

const assertionList: LabelledAssertion[] = [];

const assertionMap = new Map<string, AssertionInfo[]>();

const { constructassertion } = checkmm;

checkmm.constructassertion = (label: string, expression: Expression) => {
    const assertion = constructassertion(label, expression);
    const conclusionExpressionText = expression.join(' ');
    const assertionInfo: AssertionInfo = {
        labels: [label],
        hypothesesExpressionText: assertion.hypotheses.map(hyp => checkmm.hypotheses.get(hyp)!.first.join(' ')).sort(),
        disjvarText: Array.from(assertion.disjvars)
            .map(pair => [pair.first, pair.second].join(' '))
            .sort(),
        conclusionExpressionText,
    };

    assertionList.push({ label, assertion });
    if (!assertionMap.has(conclusionExpressionText)) {
        assertionMap.set(conclusionExpressionText, []);
    }

    const assertionInfoArray = assertionMap.get(conclusionExpressionText)!;

    for (const assertionInfoItem of assertionInfoArray) {
        if (assertionsAreEqual(assertionInfoItem, assertionInfo)) {
            assertionInfoItem.labels.push(label);
            return assertion;
        }
    }

    assertionInfoArray.push(assertionInfo);

    return assertion;
};

checkmm.main(process.argv.slice(1)).then(exitCode => {
    process.exitCode = exitCode;

    assertionList.forEach(labelledAssertion => {
        const assertionInfoArray = assertionMap.get(labelledAssertion.assertion.expression.join(' '));
        console.log(JSON.stringify(assertionInfoArray, null, 2));
        console.log();
    });
});
