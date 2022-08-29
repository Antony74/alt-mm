import checkmm, { Assertion, Expression } from 'checkmm';
import { Deque, Pair } from 'checkmm/dist/std';

interface LabelledAssertion {
    labels: string[];
    assertion: Assertion;
}

const getHypothesesAsStringArray = (hypotheses: Deque<string>): string[] => {
    // Consider only essential hypotheses, though I didn't notice any difference when I removed this step.
    const essentialHypotheses = hypotheses.filter(hyp => !checkmm.hypotheses.get(hyp)!.second);
    const expressions = essentialHypotheses.map(hyp => checkmm.hypotheses.get(hyp)!.first.join(' '));
    return expressions.sort();
};

const getdisjvarAsStringArray = (disjvars: Set<Pair<string, string>>): string[] => {
    return Array.from(disjvars)
        .map(pair => [pair.first, pair.second].join(' '))
        .sort();
};

const assertionsAreEqual = (a1: Assertion, a2: Assertion) => {
    // Ensure conclusion expressions are equal
    if (a1.expression.join(' ') !== a2.expression.join(' ')) {
        return false;
    }

    // Ensure hypotheses are equal
    if (
        !checkmm.std.arraysequal(getHypothesesAsStringArray(a1.hypotheses), getHypothesesAsStringArray(a2.hypotheses))
    ) {
        return false;
    }

    // Ensure disjoint variables are equal
    if (!checkmm.std.arraysequal(getdisjvarAsStringArray(a1.disjvars), getdisjvarAsStringArray(a2.disjvars))) {
        return false;
    }

    return true;
};

interface AssertionListItem {
    label: string;
    assertion: Assertion;
}

const assertionList: AssertionListItem[] = [];

const assertionMap = new Map<string, LabelledAssertion[]>();

const { constructassertion, parsea } = checkmm;

let axiomAndDefinitionCount = 0;

checkmm.parsea = (label: string) => {
    parsea(label);
    ++axiomAndDefinitionCount;
};

const filterAssertion = (label: string, existingLabels: string[]): boolean => {
    // Omit names with ALT or OLD that appear to duplicate one without the marking; we already know they're alternatives.
    const suffixFilters: string[] = ['ALT', 'ALT2', 'ALT3', 'OLD', 'ALTN', 'OLDN', 'VD'];
    const filterOnSuffices = suffixFilters.reduce((acc, suffix) => {
        if (!acc) {
            return false;
        } else if (label.slice(-suffix.length) === suffix) {
            return false;
        } else {
            return true;
        }
    }, true);

    if (!filterOnSuffices) {
        return false;
    }

    // Omit names that only different because of a hyphen (ax-1, ax1).
    const filterOnHyphens = existingLabels.reduce((acc, existingLabel) => {
        if (!acc) {
            return false;
        }
        return existingLabel.split('-').join('') !== label.split('-').join('');
    }, true);

    return filterOnHyphens;
};

checkmm.constructassertion = (label: string, expression: Expression) => {
    const assertion = constructassertion(label, expression);

    const conclusionExpressionText = expression.join(' ');
    const labelledAssertion: LabelledAssertion = {
        labels: [label],
        assertion,
    };

    assertionList.push({ label, assertion });
    if (!assertionMap.has(conclusionExpressionText)) {
        assertionMap.set(conclusionExpressionText, []);
    }

    const labelledAssertions = assertionMap.get(conclusionExpressionText)!;

    for (const labelledAssertion of labelledAssertions) {
        if (assertionsAreEqual(labelledAssertion.assertion, labelledAssertion.assertion)) {
            if (filterAssertion(label, labelledAssertion.labels)) {
                labelledAssertion.labels.push(label);
            }
            return assertion;
        }
    }

    if (filterAssertion(label, [])) {
        labelledAssertions.push(labelledAssertion);
    }

    return assertion;
};

checkmm.main(process.argv.slice(1)).then(exitCode => {
    process.exitCode = exitCode;

    console.log(`Axiom and definition count ${axiomAndDefinitionCount}`);
    console.log();

    console.log(
        `Each line contains the labels representing a group of repeated assertions, ordered by the first appearance`,
    );

    let uniqueAssertionsWhichAreRepeated = 0;
    let totalAssertionsWhichAreRepeated = 0;

    assertionList.forEach(labelledAssertion => {
        const label = labelledAssertion.label;
        const assertionInfoArray = assertionMap.get(labelledAssertion.assertion.expression.join(' '))!;

        const assertionInfo = assertionInfoArray.find(assertionInfoArray =>
            assertionInfoArray.labels.filter(currentLabel => currentLabel === label),
        );

        // Print the label if it's the orginal such statement and has alternative proofs
        if (assertionInfo && assertionInfo.labels.length > 1 && assertionInfo.labels[0] === label) {
            console.log(assertionInfo.labels.join(', '));
            ++uniqueAssertionsWhichAreRepeated;
            totalAssertionsWhichAreRepeated += assertionInfo.labels.length;
        }
    });

    console.log();
    console.log(`Unique assertions which are repeated: ${uniqueAssertionsWhichAreRepeated}`);
    console.log(`Total assertions which are repeated: ${totalAssertionsWhichAreRepeated}`);
});
