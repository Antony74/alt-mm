import checkmm, { Assertion, Expression } from 'checkmm';

interface AssertionInfo {
    hypothesesExpressionText: string[];
    disjvarText: string[];
    conclusionExpressionText: string;
}

interface LabelledAssertion {
    label: string;
    assertion: Assertion;
}

interface AssertionDuplicates {
    labels: string[];
    assertion: Assertion;
}

const getHypotheses = (a: Assertion): string[] => {
    return a.hypotheses.map(label => checkmm.hypotheses.get(label)!.first.join(' '));
};

const assertionsAreEqual = (a1: Assertion, a2: Assertion): boolean => {
    // Compare expressions
    const expressionsEqual = checkmm.std.arraysequal(a1.expression, a2.expression);
    if (!expressionsEqual) {
        return false;
    }

    // Compare hypotheses
    const hypothesesEqual = checkmm.std.arraysequal(getHypotheses(a1).sort(), getHypotheses(a2).sort());
    if (!hypothesesEqual) {
        return false;
    }

    // Compare disjoint variables
    const disjvars = new Set(a1.disjvars);
    let missingDisjvar = false;
    a2.disjvars.forEach(disjvar => {
        missingDisjvar &&= disjvars.delete(disjvar);
    });

    if (missingDisjvar || disjvars.size) {
        return false;
    }

    return true;
};

const assertionList: LabelledAssertion[] = [];

const assertionMap = new Map<string, AssertionDuplicates[]>();

const { constructassertion } = checkmm;

checkmm.constructassertion = (label: string, expression: Expression) => {
    const assertion = constructassertion(label, expression);
    const expressionText = expression.join(' ');

    assertionList.push({ label, assertion });
    if (!assertionMap.has(expressionText)) {
        assertionMap.set(expressionText, []);
    }

    const assertionDuplicatesArray = assertionMap.get(expressionText)!;

    for (const assertionDuplicates of assertionDuplicatesArray) {
        if (assertionsAreEqual(assertionDuplicates.assertion, assertion)) {
            assertionDuplicates.labels.push(label);
            return assertion;
        }
    }

    assertionDuplicatesArray.push({ labels: [label], assertion });

    return assertion;
};

checkmm.main(process.argv.slice(1)).then(exitCode => {
    process.exitCode = exitCode;

    assertionList.forEach(labelledAssertion => {
        const assertionDuplicatesArray = assertionMap.get(labelledAssertion.assertion.expression.join(' '));
        console.log(JSON.stringify(assertionDuplicatesArray, null, 2));
        console.log();
    })
});
