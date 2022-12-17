"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
const checkmm_1 = __importDefault(require("checkmm"));
const getHypothesesAsStringArray = (hypotheses) => {
    // Consider only essential hypotheses, though I didn't notice any difference when I removed this step.
    const essentialHypotheses = hypotheses.filter(hyp => !checkmm_1.default.hypotheses.get(hyp).second);
    const expressions = essentialHypotheses.map(hyp => checkmm_1.default.hypotheses.get(hyp).first.join(' '));
    return expressions.sort();
};
const getdisjvarAsStringArray = (disjvars) => {
    return Array.from(disjvars)
        .map(pair => [pair.first, pair.second].join(' '))
        .sort();
};
const assertionsAreEqual = (a1, a2) => {
    // Ensure conclusion expressions are equal
    if (a1.expression.join(' ') !== a2.expression.join(' ')) {
        return false;
    }
    // Ensure hypotheses are equal
    if (!checkmm_1.default.std.arraysequal(getHypothesesAsStringArray(a1.hypotheses), getHypothesesAsStringArray(a2.hypotheses))) {
        return false;
    }
    // Ensure disjoint variables are equal
    if (!checkmm_1.default.std.arraysequal(getdisjvarAsStringArray(a1.disjvars), getdisjvarAsStringArray(a2.disjvars))) {
        return false;
    }
    return true;
};
const assertionList = [];
const assertionMap = new Map();
const { constructassertion, parsea } = checkmm_1.default;
let axiomAndDefinitionCount = 0;
checkmm_1.default.parsea = (label) => {
    parsea(label);
    ++axiomAndDefinitionCount;
};
const filterAssertion = (label, existingLabels) => {
    // Omit names with ALT or OLD that appear to duplicate one without the marking; we already know they're alternatives.
    const suffixFilters = ['ALT', 'ALT2', 'ALT3', 'OLD', 'ALTN', 'OLDN', 'VD'];
    const filterOnSuffices = suffixFilters.reduce((acc, suffix) => {
        if (!acc) {
            return false;
        }
        else if (label.slice(-suffix.length) === suffix) {
            return false;
        }
        else {
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
checkmm_1.default.constructassertion = (label, expression) => {
    const assertion = constructassertion(label, expression);
    const conclusionExpressionText = expression.join(' ');
    const labelledAssertion = {
        labels: [label],
        assertion,
    };
    assertionList.push({ label, assertion });
    if (!assertionMap.has(conclusionExpressionText)) {
        assertionMap.set(conclusionExpressionText, []);
    }
    const labelledAssertions = assertionMap.get(conclusionExpressionText);
    for (const existingLabelledAssertion of labelledAssertions) {
        if (assertionsAreEqual(existingLabelledAssertion.assertion, labelledAssertion.assertion)) {
            if (filterAssertion(label, existingLabelledAssertion.labels)) {
                existingLabelledAssertion.labels.push(label);
            }
            return assertion;
        }
    }
    if (filterAssertion(label, [])) {
        labelledAssertions.push(labelledAssertion);
    }
    return assertion;
};
const logArray = [];
const log = (msg = '') => {
    console.log(msg);
    logArray.push(msg);
};
checkmm_1.default
    .main(process.argv.slice(1, 3))
    .then(exitCode => {
    process.exitCode = exitCode;
    log(`Axiom and definition count ${axiomAndDefinitionCount}`);
    log();
    log(`Each line contains the labels representing a group of repeated assertions, ordered by the first appearance`);
    let uniqueAssertionsWhichAreRepeated = 0;
    let totalAssertionsWhichAreRepeated = 0;
    assertionList.forEach(assertionListItem => {
        const label = assertionListItem.label;
        const labelledAssertionArray = assertionMap.get(assertionListItem.assertion.expression.join(' '));
        const assertionInfo = labelledAssertionArray.find(labelledAssertion => labelledAssertion.labels.filter(currentLabel => currentLabel === label));
        // Print the label if it's the orginal such statement and has alternative proofs
        if (assertionInfo && assertionInfo.labels.length > 1 && assertionInfo.labels[0] === label) {
            log(assertionInfo.labels.join(', '));
            ++uniqueAssertionsWhichAreRepeated;
            totalAssertionsWhichAreRepeated += assertionInfo.labels.length;
        }
    });
    log();
    log(`Unique assertions which are repeated: ${uniqueAssertionsWhichAreRepeated}`);
    log(`Total assertions which are repeated: ${totalAssertionsWhichAreRepeated}`);
    const outputFilename = process.argv[3];
    if (outputFilename) {
        promises_1.default.writeFile(outputFilename, logArray.join('\n'));
    }
})
    .catch(console.error);
