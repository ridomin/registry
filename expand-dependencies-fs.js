import fs from 'fs'

const dtmi2path = dtmi => {
  const idAndVersion = dtmi.toLowerCase().split(';')
  const ids = idAndVersion[0].split(':')
  const file = `${ids.pop()}-${idAndVersion[1]}.json`
  const folder = ids.join('/')
  return { folder, file }
}

const getDependencies = rootJson => {
  const deps = []
  if (rootJson.extends) {
    if (Array.isArray(rootJson.extends)) {
      rootJson.extends.forEach(e => deps.push(e))
    } else {
      deps.push(rootJson.extends)
    }
  }
  if (rootJson.contents) {
    const comps = rootJson.contents.filter(c => c['@type'] === 'Component')
    comps.forEach(c => {
      if (typeof c.schema !== 'object') {
        if (deps.indexOf(c.schema) === -1) {
          deps.push(c.schema)
        }
      }
    })
  }
  return deps
}

export const expand = async dtmi => {
  const knownIds = []
  const rootAndDeps = []

  const walkDeps = async dtmi => {
    const { folder, file } = dtmi2path(dtmi)
    const url = `${folder}/${file}`
    const doc = JSON.parse(fs.readFileSync(url, 'utf-8'))
    knownIds.push(dtmi)
    rootAndDeps[rootAndDeps.length] = doc
    console.log(dtmi)
    const deps = getDependencies(doc)
    for await (const d of deps) {
      if (knownIds.indexOf(d) === -1) {
        await walkDeps(d)
      }
    }
  }
  await walkDeps(dtmi)
  return rootAndDeps
}
