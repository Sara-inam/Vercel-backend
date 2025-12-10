import NodeCache from "node-cache";

export const cache = new NodeCache({  stdTTL: 3 });

export const flushEmployeeCache = () => {
  cache.del("employees"); 
  console.log("Employee cache flushed");
};
export const flushDepartmentCache = () => {
   cache.del("departments");
  console.log("Department cache flushed");
};
export const flushProfileCache = (userId) => {
  if (userId) cache.del(`profile_${userId}`);
  else cache.flushAll();
};
