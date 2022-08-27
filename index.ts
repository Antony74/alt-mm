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
    if (a1.conclusionExpressionText !== a2.conclusionExpressionText) {
        return false;
    }

    if (!checkmm.std.arraysequal(a1.hypothesesExpressionText, a2.hypothesesExpressionText)) {
        return false;
    }

    if (!checkmm.std.arraysequal(a1.disjvarText, a2.disjvarText)) {
        return false;
    }

    return true;
};

const assertionList: LabelledAssertion[] = [];

const assertionMap = new Map<string, AssertionInfo[]>();

const { constructassertion, parsea } = checkmm;

let axiomAndDefinitionCount = 0;

checkmm.parsea = (label: string) => {
    parsea(label);
    ++axiomAndDefinitionCount;
};

checkmm.constructassertion = (label: string, expression: Expression) => {
    const assertion = constructassertion(label, expression);
    const conclusionExpressionText = expression.join(' ');
    const assertionInfo: AssertionInfo = {
        labels: [label],
        hypothesesExpressionText: assertion.hypotheses
            .filter(hyp => !checkmm.hypotheses.get(hyp)!.second)
            .map(hyp => checkmm.hypotheses.get(hyp)!.first.join(' '))
            .sort(),
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

    console.log(`Axiom and definition count ${axiomAndDefinitionCount}`);
    console.log();

    console.log(
        `Each line contains the labels representing a group of repeated assertions, ordered by the first appearence`,
    );

    let uniqueAssertionsWhichAreRepeated = 0;
    let totalAssertionsWhichAreRepeated = 0;

    assertionList.forEach(labelledAssertion => {
        const label = labelledAssertion.label;
        const assertionInfoArray = assertionMap.get(labelledAssertion.assertion.expression.join(' '))!;

        const assertionInfo = assertionInfoArray.find(assertionInfoArray =>
            assertionInfoArray.labels.filter(currentLabel => currentLabel === label),
        )!;

        // Print the label if it's the orginal such statement and has alternative proofs
        if (assertionInfo.labels.length > 1 && assertionInfo.labels[0] === label) {
            console.log(assertionInfo.labels.join(', '));
            ++uniqueAssertionsWhichAreRepeated;
            totalAssertionsWhichAreRepeated += assertionInfo.labels.length;
        }
    });

    console.log();
    console.log(`Unique assertions which are repeated: ${uniqueAssertionsWhichAreRepeated}`);
    console.log(`Total assertions which are repeated: ${totalAssertionsWhichAreRepeated}`);
});
