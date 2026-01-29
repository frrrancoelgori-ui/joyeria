// Decoradores para optimización y cache
export function memoize(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor?.value;
  if (!method) return descriptor;
  
  const cache = new Map();

  descriptor.value = function (...args: any[]) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = method.apply(this, args);
    cache.set(key, result);
    return result;
  };
  
  return descriptor;
}

export function debounce(delay: number) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor?.value;
    if (!method) return descriptor;
    
    let timeout: NodeJS.Timeout;

    descriptor.value = function (...args: any[]) {
      clearTimeout(timeout);
      timeout = setTimeout(() => method.apply(this, args), delay);
    };
    
    return descriptor;
  };
}

export function performance(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor?.value;
  if (!method) return descriptor;

  descriptor.value = function (...args: any[]) {
    const start = performance.now();
    const result = method.apply(this, args);
    const end = performance.now();
    console.log(`${propertyName} executed in ${end - start} milliseconds`);
    return result;
  };
  
  return descriptor;
}

export function asyncQueue(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor?.value;
  if (!method) return descriptor;
  
  const queue: Promise<any>[] = [];

  descriptor.value = async function (...args: any[]) {
    const promise = method.apply(this, args);
    queue.push(promise);
    
    try {
      const result = await promise;
      queue.splice(queue.indexOf(promise), 1);
      return result;
    } catch (error) {
      queue.splice(queue.indexOf(promise), 1);
      throw error;
    }
  };
  
  return descriptor;
}