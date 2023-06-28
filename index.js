const R = require("ramda")

const RESOURCE_HIERARCHY = {

  CHAT_BOT_MODULE: {

    BOT_MARKET_PLACE: {

      BOT: 1

    },

    BOT: {

      '*': {

        // the '*' has a special meaning. * means there is a user defined resource is there

        ROOT_DIALOG_NODE: {

          '*': {

            CONDITION: 1,

            RESPONSE_NODE: 1,

          },

        },

        SUB_DIALOG_NODE: {

          '*': {

            CONDITION: 1,

            RESPONSE_NODE: 1,

          },

        },

        GROUP_DIALOG_NODE: {

          '*': { CONDITION: 1 },

        },

        INTENTS: {

          '*': { EXAMPLES: 1 },

        },

        ENTITY: {

          '*': { ENTITY_VALUE: 1 },

        },

        AGENT_BOT: 1,

        SETTINGS: 1,

        LOGS: 1,

        CHATBOT_SUMMARY: 1,

      },

    },

  },

  TRANING_MODULE: { USER_UTTERANCES: 1 },

  ENGINE: { PUBLIC_BOT: 1 },

  BOT_MARKET_PLACE: 1,

  WORKFLOW_MODULE: {

    WORKFLOWS: {

      '*': 1

    },

    PUBLISHED_WORKFLOWS: 1,

    ON_PREM: 1

  },

  WELCOME_PAGE: 1,

  BILLING_PAGE: 1,

  CHAT_CHANNEL_MODULE: {

    CHANNEL: {

      '*': {

        INTEGRATION: {

          '*': 1

        }

      }

    }

  },

  WORKFLOW_MARKET_PLACE: 1,

  USERS_MODULE: { USERS: 1 },

}

const SAMPLE_PERMISSION_TREE = {
  CHAT_BOT_MODULE: {
    permission: "READ.WRITE.DELETE",
    children: {
      BOT: {
        permission: "READ.WRITE.DELETE"
      }
    }
  }
}

const acl = {
  "nirup": {
    "CHAT_BOT_MODULE/**": "READ.WRITE.DELETE",
    "TRAINING_MODULE/**": "READ.WRITE.DELETE",
    "BOT_MARKET_PLACE/**": "READ.WRITE.DELETE",
    "ENGINE/PUBLIC_BOT": "READ.WRITE.DELETE",
    "WORKFLOW_MODULE": "READ",
    "WORKFLOW_MODULE/WORKFLOWS/123/**": "READ.WRITE.DELETE",
    "WORKFLOW_MARKET_PLACE/**": "READ.WRITE.DELETE",
    "USERS_MODULE/**": "READ.WRITE.DELETE"
  },
  "manjulaworkspace": {
      "CHAT_BOT_MODULE/BOT/434981d3-5ec6-449b-ae12-08f6eca28d4c": "READ",
      "CHAT_BOT_MODULE/BOT/434981d3-5ec6-449b-ae12-08f6eca28d4c/ROOT_DIALOG_NODE/*/CONDITION": "READ.WRITE.DELETE",
      "CHAT_BOT_MODULE/BOT/434981d3-5ec6-449b-ae12-08f6eca28d4c/ROOT_DIALOG_NODE/*/RESPONSE_NODE": "READ.WRITE.DELETE",
      "CHAT_BOT_MODULE/BOT/434981d3-5ec6-449b-ae12-08f6eca28d4c/SUB_DIALOG_NODE/**": "READ.WRITE.DELETE",
      "CHAT_BOT_MODULE/BOT/434981d3-5ec6-449b-ae12-08f6eca28d4c/INTENTS": "READ.WRITE.DELETE",
      "CHAT_BOT_MODULE/BOT/434981d3-5ec6-449b-ae12-08f6eca28d4c/INTENTS/*": "READ.WRITE.DELETE",
      "CHAT_BOT_MODULE/BOT/434981d3-5ec6-449b-ae12-08f6eca28d4c/INTENTS/*/EXAMPLES": "READ.WRITE.DELETE",
      "CHAT_BOT_MODULE/BOT/434981d3-5ec6-449b-ae12-08f6eca28d4c/ENTITY": "READ.WRITE.DELETE",
      "CHAT_BOT_MODULE/BOT/434981d3-5ec6-449b-ae12-08f6eca28d4c/ENTITY/*": "READ.WRITE.DELETE",
      "CHAT_BOT_MODULE/BOT/434981d3-5ec6-449b-ae12-08f6eca28d4c/ENTITY/*/ENTITY_VALUE ": "READ.WRITE.DELETE",
      "CHAT_BOT_MODULE/BOT/434981d3-5ec6-449b-ae12-08f6eca28d4c/AGENT_BOT": "READ.WRITE.DELETE",
      "CHAT_BOT_MODULE/BOT/434981d3-5ec6-449b-ae12-08f6eca28d4c/SETTINGS": "READ.WRITE",
      "CHAT_BOT_MODULE/BOT/434981d3-5ec6-449b-ae12-08f6eca28d4c/ROOT_DIALOG_NODE": "READ.WRITE.DELETE",
      "CHAT_BOT_MODULE/BOT/434981d3-5ec6-449b-ae12-08f6eca28d4c/CHATBOT_SUMMARY": "READ",
      "CHAT_BOT_MODULE/BOT/434981d3-5ec6-449b-ae12-08f6eca28d4c/LOGS": "READ",
      "TRAINING_MODULE/**": "READ",
      "CHAT_BOT_MODULE/BOT": "READ",
      "BOT_MARKET_PLACE": "READ",
      "ENGINE/PUBLISHED_BOT": "READ"
    }
}



const resourceHasStar = (resourceObj) => {
  return Object.keys(resourceObj).length === 1 && !!resourceObj["*"]
}

const handleSingleStar = (parsedPath, resourceObj, prevPath = []) => {
  let keys = Object.keys(resourceObj)
  return keys.reduce((paths, curr) => {
    let currPath = [...prevPath, curr]
    return [...paths, currPath, ...traverse(parsedPath.slice(1), resourceObj[curr], currPath)]
  }, [])
}

// const handleDblStar = (resourceObj, prevPath = []) => {
//   let keys = Object.keys(resourceObj)
//   return keys.reduce((paths, curr) => {
//     let currPath = [...prevPath, curr]
//     return [...paths, currPath, ...handleDblStar(resourceObj[curr], currPath)]
//   }, [])
// }

// const traverse = (parsedPath, resourceObj, prevPath = []) => {
//   if (!parsedPath.length) { return [] }
//   const currentPath = parsedPath[0]
//   if (currentPath.type === "iden") {
//     if (resourceObj[currentPath.value] || resourceHasStar(resourceObj)) {
//       let currPath = [...prevPath, currentPath.value]
//       return [currPath, ...traverse(parsedPath.slice(1), resourceObj[currentPath.value] || resourceObj["*"], currPath)]
//     }
//   } else if (currentPath.type === "single_star") {
//     return handleSingleStar(parsedPath, resourceObj, prevPath)
//   } else if (currentPath.type === "dbl_star") {
//     return handleDblStar(resourceObj, prevPath)
//   }
//   return []
// }

const pathSeqIden = value => ({ type: "iden", value, wildCard: false })

const parsePathSeg = pathSeg => {
  if (pathSeg.length === 1 && pathSeg === "*") { return { type: "single_star", wildCard: true } }
  else if (pathSeg.length === 2 && pathSeg === "**") { return { type: "dbl_star", wildCard: true } }
  return pathSeqIden(pathSeg)
}

const parsePath = (path) =>
  path.split("/").map(parsePathSeg)

const getResourceFromPathSeq = (resourceObj, { value }) => {
  if (resourceHasStar(resourceObj)) { return resourceObj["*"] }
  return R.prop(value, resourceObj)
}

// the path must be parsed and without wildcard in it
const getResourceObj = (path, resourceObj) => {
  return path.reduce(getResourceFromPathSeq, resourceObj)
}

const matchPath = (path, resourceObj) => {
  return !!getResourceObj(path, resourceObj)
}

const hasWildCard = R.any(R.prop("wildCard"))

const hasDoubleStarAtEnd = R.compose(
  R.propEq("dbl_star", "type"),
  R.last
)

const sepPathByWildCard = R.reduce((paths, currPath) => {
  if (currPath.wildCard) {
    return [...paths, currPath]
  }
  const last = paths[paths.length - 1]
  if (Array.isArray(last)) {
    return [...paths.slice(0, paths.length - 1), [...last, currPath]]
  } else {
    return [...paths, [currPath]]
  }
}, [])

function combineArrays(l1, l2) {
  return R.pipe(
    R.chain(R.xprod(l1)),
    R.map(R.unnest)
  )(l2);
}

const combinePaths = (l1, l2) => {
  let paths = []
  for (let i = 0; i < l1.length; i++) {
    if (!l2[i].length) {
      paths.push(l1[i]);
      continue
    }
    for (let j = 0; j < l2[i].length; j++) {
      paths.push(R.append(l2[i][j], l1[i]))
    }
  }
  return paths
}


const traverseAllDecForSinglePath = path => {
  let currResourceObj = getResourceObj(path.map(pathSeqIden), RESOURCE_HIERARCHY)
  if (!currResourceObj) { return [] }
  let keys = Object.keys(currResourceObj)
  return keys.reduce((possiblePaths, curr) => {
    let currPath = [...path, curr]
    return [...possiblePaths, currPath, ...traverseAllDecForSinglePath(currPath)]
  }, [])
}

const traverseAllDec = (paths, resource) => {
  return R.unnest(paths.map(traverseAllDecForSinglePath))
}

const handleDblStar = (path, resource) => {
  let doubleStar = path[path.length - 1]
  let otherPath = path.slice(0, path.length - 1)
  let generatedPaths = constructIndividualResources(otherPath.map(({ value }) => value).join("/"))
  return [...generatedPaths, ...traverseAllDec(generatedPaths, resource)]
}

const constructIndividualResources = (path) => {
  const parsedPath = parsePath(path)
  if (!hasWildCard(parsedPath) && matchPath(parsedPath, RESOURCE_HIERARCHY)) {
    return [parsedPath.map(({ value }) => value)]
  } else if (!hasDoubleStarAtEnd(parsedPath)) {
    let paths = sepPathByWildCard(parsedPath)
    return paths.reduce((possiblePaths, currPath) => {
      if (!possiblePaths.length && Array.isArray(currPath)) {
        return [currPath.map(({ value }) => value)]
      } else if (!possiblePaths.length && currPath.wildCard) {
        return [Object.keys(RESOURCE_HIERARCHY)]
      } else if (currPath.wildCard) {
        const currentPossiblePaths = possiblePaths.map(R.map(pathSeqIden)).map((path) => getResourceObj(path, RESOURCE_HIERARCHY)).map(Object.keys)
        return combinePaths(possiblePaths, currentPossiblePaths)
        // return possiblePaths.map((path, i) => R.unnest(R.xprod(path, currentPossiblePaths[i])))
      }
      return possiblePaths
    }, [])
  } else {
    return handleDblStar(parsedPath, RESOURCE_HIERARCHY)
  }
}
const appendChildrenPath = (paths, currentPath) => [...paths, currentPath, "children"]

const addChildPaths = (resourcePaths) =>
  [
    ...resourcePaths.slice(0, resourcePaths.length - 1).reduce(appendChildrenPath, []),
    resourcePaths[resourcePaths.length - 1]
  ]


const accessObj = (str) => {
  const keys = R.split('.', str);
  const values = R.repeat(1, keys.length);

  return R.zipObj(keys, values);
}

const assignPermission = R.curry((access, permissionTree, resourcePath) => R.assocPath([...addChildPaths(resourcePath), "permission"], accessObj(access), permissionTree))

const addPermissionToTree = (tree, [resourcePath, access]) => {
  const individualResourcesPath = constructIndividualResources(resourcePath) // [["CHAT_BOT_MODULE"], ["CHAT_BOT_MODULE", "BOT"]...]
  return individualResourcesPath.reduce(assignPermission(access), tree)
}

const generateSubTree = (acl, ws) => { // have to export
  const permissionList = acl[ws]
  const resourceTree = permissionList ? Object.entries(permissionList).reduce(addPermissionToTree, {}) : {}
  return { permission: {}, children: resourceTree } // consider this root object as workspace
}

let tree = generateSubTree(acl, "manjulaworkspace")

console.log({ tree })

const getResourceFromTree = (resourcePath, resourceTree) => {
  if (!resourcePath.length) { return resourceTree }
  const currPath = resourcePath[0]
  const currResource = resourceTree.children
  if (resourceHasStar(currResource)) { return getResourceFromTree(resourcePath.slice(1), currResource["*"]) }
  return currResource[currPath] ? getResourceFromTree(resourcePath.slice(1), currResource[currPath]) : null
}

const hasPermission = R.curry((resourcePath, permission, resourceTree) => { // have to export
  const resource = getResourceFromTree(resourcePath.split("/"), resourceTree)
  if (!resource) { return false }
  const givenPermObj = accessObj(permission)
  const resourcePermissions = resource.permission
  return Object.keys(givenPermObj).every((perm) => resourcePermissions[perm] === 1)
})

console.log(hasPermission("CHAT_BOT_MODULE/BOT/434981d3-5ec6-449b-ae12-08f6eca28d4c/ENTITY/b91ea07e-a64f-4f69-9da2-6df41113c6d4/ENTITY_VALUE", "WRITE", tree))

// console.log(constructIndividualResources("CHAT_BOT_MODULE/**")) // [["WORKFLOW_MODULE", "WORKFLOWS"], ["WORKFLOW_MODULE", "ON_PREM"], ["WORKFLOW_MODULE", "PUBLISHED_WORKFLOW"]]  

// console.log(handleDblStar([
//     { type: 'iden', value: 'CHAT_BOT_MODULE', wildCard: false },
//     { type: 'dbl_star', wildCard: true }
//   ], RESOURCE_HIERARCHY))