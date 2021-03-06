/* global suite, test */
const assert = require('assert')
const vscode = require('vscode')
const fs = require('fs')
const path = require('path')
const adrUtils = require('../adrfunc/adr-utils')
const clean = require('../clean')

const RecordArchitectureDecision = `# 0. Record architecture decisions

Date: {{ date }}

## Status

Status: {{ status }}

## Context

We need to record the architectural decisions made on this project.

## Decision

We will use Architecture Decision Records, as [described by Michael Nygard](http://thinkrelevance.com/blog/2011/11/15/documenting-architecture-decisions).

## Consequences

See Michael Nygard's article, linked above. 
For a lightweight ADR toolset, see Nat Pryce's [adr-tools](https://github.com/npryce/adr-tools).
For a Visual Studio Code ADR toolset extention, see Vincent Le Dû's [vscode-adr-extention](https://github.com/vincent-ledu/adr-template)
`
const indexRecordnameMD = `# {{ adr-index}}. {{ adr-name }}

Date: {{ date }}

## Status

Status: {{ status }}  
{{ links }}

## Context

The issue motivating this decision, and any context that influences or constrains the decision.

## Decision

The change that we're proposing or have agreed to implement.

## Consequences

What becomes easier or more difficult to do and any risks introduced by the change that will need to be mitigated.
`
const d = new Date().toISOString().split('T')[0]
const adr0000 = `# 0. Record architecture decisions

Date: ` + d + `

## Status

Status: Accepted on ` + d + `

## Context

We need to record the architectural decisions made on this project.

## Decision

We will use Architecture Decision Records, as [described by Michael Nygard](http://thinkrelevance.com/blog/2011/11/15/documenting-architecture-decisions).

## Consequences

See Michael Nygard's article, linked above. 
For a lightweight ADR toolset, see Nat Pryce's [adr-tools](https://github.com/npryce/adr-tools).
For a Visual Studio Code ADR toolset extention, see Vincent Le Dû's [vscode-adr-extention](https://github.com/vincent-ledu/adr-template)
`
suite('Extension Tests', function () {
  let rootPath = path.join(process.env.TEMP, 'testworkspace', 'adrfunctions')
  let adrPath = path.join(rootPath, 'doc/adr')
  let adrTemplatePath = path.join(rootPath, '.adr-templates')

  this.beforeAll(function () {
    clean.deleteFolderRecursive(adrPath)
  })

  test('adr init', function () {
    adrUtils.init(
      adrPath,
      adrTemplatePath,
      vscode.workspace.getConfiguration().get('adr.templates.repo')
    )
    assert.strictEqual(
      fs.readFileSync(
        path.join(adrTemplatePath, 'index-recordname.md'), 'utf8').replace(/\r/gm, ''),
      indexRecordnameMD
    )
    assert.strictEqual(
      fs.readFileSync(
        path.join(adrTemplatePath, '0000-record-architecture-decisions.md'), 'utf8').replace(/\r/gm, ''),
      RecordArchitectureDecision
    )
    assert.strictEqual(
      fs.readFileSync(
        path.join(adrPath, '0000-record-architecture-decisions.md'), 'utf8').replace(/\r/gm, ''),
      adr0000
    )
  })

  test('adr new', function () {
    let adr1 = adrUtils.createNewAdr({ srcAdrName: 'My Test ADR 1', status: 'Accepted' },
      adrPath,
      adrTemplatePath
    )
    let adr2 = adrUtils.createNewAdr(
      { srcAdrName: 'My Test ADR 2', status: 'Accepted', linkType: 'Supersedes', tgtAdrName: '0001-my-test-adr-1.md' },
      adrPath,
      adrTemplatePath
    )
    let adr3 = adrUtils.createNewAdr({ srcAdrName: 'My Test ADR 3', status: 'Accepted', linkType: 'Amends', tgtAdrName: '0002-my-test-adr-2.md' },
      adrPath,
      adrTemplatePath
    )

    assert.strictEqual(fs.existsSync(adr1), true)
    assert.strictEqual(fs.existsSync(adr2), true)
    assert.strictEqual(fs.existsSync(adr3), true)
    let data = fs.readFileSync(adr1, 'utf8')
    assert.strictEqual(data.includes('Status: Superseded on '), true)
    assert.strictEqual(data.includes('Previous status: Accepted on '), true)
    assert.strictEqual(data.includes('Superseded by [0002-my-test-adr-2.md](0002-my-test-adr-2.md) on '), true)
    data = fs.readFileSync(adr2, 'utf8')
    assert.strictEqual(data.includes('Status: Accepted on '), true)
    assert.strictEqual(data.includes('Amended by [0003-my-test-adr-3.md](0003-my-test-adr-3.md) on '), true)
    assert.strictEqual(data.includes('Supersedes [0001-my-test-adr-1.md](0001-my-test-adr-1.md) on '), true)
    data = fs.readFileSync(adr3, 'utf8')
    assert.strictEqual(data.includes('Status: Accepted on '), true)
    assert.strictEqual(data.includes('Amends [0002-my-test-adr-2.md](0002-my-test-adr-2.md) on '), true)
  })

  test('adr link', function () {
    if (typeof rootPath === 'undefined') {
      rootPath = './testworkspace/adrfunctions'
    }
    let srcFilePath = adrUtils.createNewAdr({ srcAdrName: 'My Test ADR 4', status: 'Accepted' },
      adrPath,
      adrTemplatePath
    )
    let tgtFilePath = adrUtils.createNewAdr({ srcAdrName: 'My Test ADR 5', status: 'Accepted' },
      adrPath,
      adrTemplatePath
    )

    adrUtils.addLink('0005-mytest5adr.md', srcFilePath, 'Amends')
    adrUtils.addLink('0004-mytest4adr.md', tgtFilePath, 'Amended by')
    assert.strictEqual(fs.existsSync(srcFilePath), true)
    assert.strictEqual(fs.existsSync(tgtFilePath), true)
    let data = fs.readFileSync(tgtFilePath)
    assert.strictEqual(data.includes('Amended by [0004-mytest4adr.md](0004-mytest4adr.md) on '), true)
    data = fs.readFileSync(srcFilePath)
    assert.strictEqual(data.includes('Amends [0005-mytest5adr.md](0005-mytest5adr.md) on '), true)
  })
})
