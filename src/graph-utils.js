const Queue = require('./structures');

const isCyclicUtil = (graph, node, visited, stack, history = []) => {
  visited[node] = true;
  stack[node] = true;

  for (const neighbour of graph[node].dependencies) {
    const stackHistory = [...history, neighbour];
    if (!visited[neighbour]) {
      const data = isCyclicUtil(graph, neighbour, visited, stack, stackHistory);
      if (data.status) {
        return { status: true, stackHistory: data.stackHistory };
      }
    } else if (stack[neighbour] === true) {
      return { status: true, stackHistory };
    }
  }

  stack[node] = false;

  return { status: false };
};

const dependencyCycleDetection = (dependencyGraph) => {
  // Converted to JS from here: https://www.geeksforgeeks.org/detect-cycle-in-a-graph/
  const visited = {};
  const stack = {};
  const stackHistory = [];
  for (const node of Object.keys(dependencyGraph)) {
    if (!visited[node]) {
      const cycleData = isCyclicUtil(dependencyGraph, node, visited, stack);
      if (cycleData.status) {
        stackHistory.push([node, ...cycleData.stackHistory]);
      }
    }
  }
  return { status: stackHistory.length > 0, stackHistory };
};

const satisfyDependencyConstraints = (dependencyGraph) => {
  const unsatisfiedDependencies = new Set();
  for (const dependency of Object.keys(dependencyGraph)) {
    for (const key of dependencyGraph[dependency].dependencies) {
      if (!dependencyGraph[key]) {
        unsatisfiedDependencies.add(key);
      }
    }
  }
  return Array.from(unsatisfiedDependencies.values());
};

const getIndegreeAndAdjacencyList = (dependencyGraph) => {
  global.log('Generating in-degree map and adjacency list off dependency graph');
  const inDegreeMap = {};
  const adjList = {};

  for (const node of Object.keys(dependencyGraph)) {
    inDegreeMap[node] = dependencyGraph[node].dependencies.length;
    adjList[node] = [];
  }

  for (const node of Object.keys(dependencyGraph)) {
    for (const neighbour of dependencyGraph[node].dependencies) {
      adjList[neighbour].push(node);
    }
  }

  global.log('Completed generation of in-degree map and adjacency list');
  global.log('-');
  return { inDegreeMap, adjList };
};

const topologicalDependencySort = (dependencyGraph) => {
  // Kahn's algorithm
  global.log('Starting sorting process for correct dependency API call order');
  const { inDegreeMap, adjList } = getIndegreeAndAdjacencyList(dependencyGraph);
  const dependencyQueue = new Queue();

  Object.keys(dependencyGraph).forEach(() => {
    // Check for nodes with zero in-degrees across each iteration
    // If none are found, there is no solution since all nodes are
    // cyclically dependant on each other
    let cyclic = true;

    let node; // Last node with no dependency
    for (node of Object.keys(dependencyGraph)) {
      if (inDegreeMap[node] === 0) {
        cyclic = false;
        break;
      }
    }
    if (cyclic) {
      throw Error('Dependencies cannot be sorted, cyclic loop detected}');
    }

    inDegreeMap[node] -= 1;
    dependencyQueue.enqueue(node);
    for (const neighbour of adjList[node]) {
      inDegreeMap[neighbour] -= 1;
    }
  });

  global.log('Completed sorting of dependencies, proceeding to API call process...');
  global.log('-');
  return dependencyQueue;
};

module.exports = {
  satisfyDependencyConstraints,
  dependencyCycleDetection,
  topologicalDependencySort,
};