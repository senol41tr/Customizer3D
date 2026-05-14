// https://stackoverflow.com/a/71526030
export const mergeRecursive = (targetObject, sourceObject) => {
Object.keys(sourceObject).forEach(function(key) {
    if (typeof sourceObject[key] === "object") {
    if (targetObject[key] === undefined) {
        targetObject[key] = {};
    }
    mergeRecursive(targetObject[key], sourceObject[key]);
    } else {
    targetObject[key] = sourceObject[key];
    }
});
};
