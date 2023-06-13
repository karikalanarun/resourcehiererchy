const R = require("ramda")

const RESOURCE_HIERARCHY = {
  CHAT_BOT_MODULE: {
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
        ENTITIES: {
          '*': { ENTITY_VALUE: 1 },
        },
        AGENT_BOT: 1,
        SETTINGS: 1,
        LOGS: 1,
      },
    },
  },
  TRANING_MODULE: { USER_UTTERANCES: 1 },
  ENGINE: { PUBLISHED_BOT: 1 },
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
  CHATBOT_SUMMARY: 1,
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

const handleDblStar = (resourceObj, prevPath = []) => {
  let keys = Object.keys(resourceObj)
  return keys.reduce((paths, curr) => {
    let currPath = [...prevPath, curr]
    return [...paths, currPath, ...handleDblStar(resourceObj[curr], currPath)]
  }, [])
}

const traverse = (parsedPath, resourceObj, prevPath = []) => {
  if (!parsedPath.length) { return [] }
  const currentPath = parsedPath[0]
  if (currentPath.type === "iden") {
    if (resourceObj[currentPath.value] || resourceHasStar(resourceObj)) {
      let currPath = [...prevPath, currentPath.value]
      return [currPath, ...traverse(parsedPath.slice(1), resourceObj[currentPath.value] || resourceObj["*"], currPath)]
    }
  } else if (currentPath.type === "single_star") {
    return handleSingleStar(parsedPath, resourceObj, prevPath)
  } else if (currentPath.type === "dbl_star") {
    return handleDblStar(resourceObj, prevPath)
  }
  return []
}


const parsePathSeg = pathSeg => {
  if (pathSeg.length === 1 && pathSeg === "*") { return { type: "single_star", wildCard: true } }
  else if (pathSeg.length === 2 && pathSeg === "**") { return { type: "dbl_star", wildCard: true } }
  return { type: "iden", value: pathSeg, wildCard: false }
}

const parsePath = (path) =>
  path.split("/").map(parsePathSeg)


const constructIndividualResources = (path) => {
  const parsedPath = parsePath(path)
  return traverse(parsedPath, RESOURCE_HIERARCHY)
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

let tree = generateSubTree(acl, "nirup")

const getResourceFromTree = (resourcePath, resourceTree) => {
  if (!resourcePath.length) { return resourceTree }
  const currPath = resourcePath[0]
  const currResource = resourceTree.children
  if (resourceHasStar(currResource)) { return getResourceFromTree(resourcePath.slice(1), currResource["*"]) }
  return currResource[currPath] ? getResourceFromTree(resourcePath.slice(1), currResource[currPath]) : null
}

const hasPermission = R.curry((resourcePath, permission, resourceTree) => { // have to export
  const resource = getResourceFromTree(resourcePath.split("/"), resourceTree)
  if(!resource) {return false}
  const givenPermObj = accessObj(permission)
  const resourcePermissions = resource.permission
  return Object.keys(givenPermObj).every((perm) => resourcePermissions[perm] === 1)
})

console.log(hasPermission("WORKFLOW_MODULE/WORKFLOWS/123", "READ.WRITE", tree))

// console.log(constructIndividualResources("CHAT_BOT_MODULE/**"))  