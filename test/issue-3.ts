/**
 * Fixes https://github.com/woutervh-/typescript-is/issues/3
 */

import * as assert from 'assert';
import * as path from 'path';
import * as ts from 'typescript';
import { transformNode } from '../lib/transform-inline/transform-node';
import { PartialVisitorContext } from '../lib/transform-inline/visitor-context';

const configFilename = path.resolve('tsconfig.json');
const inFile = path.resolve(__dirname, '..', 'test-fixtures', 'issue-3.ts');
const content = ts.sys.readFile(configFilename);
if (content === undefined) {
    throw new Error('Could not read config file.');
}
const configFile = ts.parseConfigFileTextToJson(configFilename, content);
const configParseResult = ts.parseJsonConfigFileContent(configFile.config, ts.sys, path.dirname(configFilename), {}, path.basename(configFilename));
configParseResult.options.noEmit = true;
delete configParseResult.options.out;
delete configParseResult.options.outDir;
delete configParseResult.options.outFile;
delete configParseResult.options.declaration;
const program = ts.createProgram([inFile], configParseResult.options);
ts.createProgram([inFile], configParseResult.options);

const visitorContext: PartialVisitorContext = {
    checker: program.getTypeChecker(),
    program,
    typeMapperStack: [],
    previousTypeReference: null
};

function visitNodeAndChildren(node: ts.Node) {
    ts.forEachChild(transformNode(node, visitorContext), visitNodeAndChildren);
}

describe('visitor', () => {
    describe('visitor test-fixtures/issue-3.ts', () => {
        const expectedMessageRegExp = /Classes cannot be validated. Please check the README.$/;

        it('should throw an error for classes', () => {
            assert.throws(() => {
                visitNodeAndChildren(program.getSourceFile(inFile)!);
            }, expectedMessageRegExp);
        });
    });
});
