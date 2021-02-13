export interface Options {
  end?: boolean;
  exists?: boolean;
  unique?: boolean;
}

export type Comparitor<T, V = T> = (value: T, find: V, x?: any) => number;

/**
 * Search for the value in the array and return the index
 * @param arr
 * @param search
 * @param comparitor
 * @returns Index of the found key or -1 if not found
 */
export const bs = <T, V>(arr: T[], search: V, comparitor?: Comparitor<T, V>) => {
  if (!arr) return -1;
  // as long as it has a length i will try and itterate over it.
  if (arr.length === undefined) return -1;

  if (!comparitor) comparitor = _defaultComparitor();

  return bsInner(arr, search, comparitor);
}

/**
 * find first key that matches
 * @param arr
 * @param search
 * @param comparitor
 * @returns Index of the first matching key or -1 if not found
 */
export const first = <T, V>(arr: T[], search: V, comparitor?: Comparitor<T, V>) => {
  return closest(arr, search, { exists: true }, comparitor);
}

/**
 * find last key that matches
 * @param arr
 * @param search
 * @param comparitor
 * @returns Index of the found key or -1 if not found
 */
export const last = <T, V>(arr: T[], search: V, comparitor?: Comparitor<T, V>) => {
  return closest(arr, search, { exists: true, end: true }, comparitor);
}

/**
 * find closest key to where or key of searched value in the array
 * - if the key is in the array the key will point to
 *   - the first key that has that value by default
 *   - the last key that has that value if {end:true} option is specified
 * @param arr
 * @param search Value to be searched for
 * @param opts Options
 * @param comparitor
 * @returns index of the closest element or -1 if array is empty
 */
export function closest <T, V>(arr: T[], search: V, comparitor: Comparitor<T, V>): number;
export function closest <T, V>(arr: T[], search: V, opts: Options, comparitor?: Comparitor<T, V>): number;
export function closest <T, V>(arr: T[], search: V, opts: Options | Comparitor<T, V>, comparitor?: Comparitor<T, V>): number {

  if (typeof opts === 'function') {
    comparitor = opts;
    opts = {};
  }

  if (arr.length === 0) return -1;
  if (arr.length === 1) return 0;

  opts = opts || {};
  if (!comparitor) comparitor = _defaultComparitor();

  var closest = bsclosest(arr, search, comparitor, opts.end || false, !opts.exists);

  if (closest > arr.length - 1) closest = arr.length - 1;
  else if (closest < 0) closest = 0;

  return closest;
}

/**
 * inserts element into the correct sorted spot into the array
 *
 * @param arr
 * @param search
 * @param comparitor
 * @returns The index where the element was inserted at
 */
export function insert <T>(arr: T[], search: T, comparitor?: Comparitor<T, T>): number;
export function insert <T>(arr: T[], search: T, opts?: Options, comparitor?: Comparitor<T, T>): number;
export function insert <T>(arr: T[], search: T, opts?: Options | Comparitor<T, T>, comparitor?: Comparitor<T, T>): number {

  if (typeof opts === 'function') {
    comparitor = opts;
    opts = {};
  }

  opts = opts || {};
  if (!comparitor) comparitor = _defaultComparitor();
  if (!arr.length) {
    arr[0] = search;
    return 0;
  }

  var closestIndex = closest(arr, search, comparitor);

  var cmp = comparitor(arr[closestIndex], search);
  if (cmp < 0) {//less
    arr.splice(++closestIndex, 0, search);
  } else if (cmp > 0) {
    arr.splice(closestIndex, 0, search);
  } else {
    if (opts.unique) {
      arr[closestIndex] = search;
    } else {
      // im equal. this value should be appended to the list of existing same sorted values.
      while (comparitor(arr[closestIndex], search) === 0) {
        if (closestIndex >= arr.length - 1) break;
        closestIndex++;
      }

      arr.splice(closestIndex, 0, search);
    }
  }
  return closestIndex;
}

/**
 * query for a range between from and to.
 *
 * @param arr
 * @param from First index
 * @param to Last index (inclusive)
 * @param comparitor
 * @returns The array of indices between from and to
 */

export const range = <T, V>(arr: T[], from: V, to: V, comparitor?: Comparitor<T, V>) => {
  if (!comparitor) comparitor = _defaultComparitor();

  var fromi = closest(arr, from, comparitor);

  var toi = closest(arr, to, { end: true }, comparitor);

  // this is a hack.
  // i should be able to fix the algorithm and generate a correct range.

  while (fromi <= toi) {
    if (comparitor(arr[fromi], from) > -1) break;

    fromi++
  }

  while (toi >= fromi) {
    if (comparitor(arr[toi], to) < 1) break;
    toi--;
  }

  return [fromi, toi];
}

/**
 * query for a range of values.
 *
 * @param arr
 * @param from First index
 * @param to Last index (inclusive)
 * @param comparitor
 * @returns The array of values between from and to
 */
export const rangeValue = <T, V>(arr: T[], from: V, to: V, comparitor?: Comparitor<T, V>) => {
  var rangeArray = range(arr, from, to, comparitor);
  return arr.slice(rangeArray[0], rangeArray[1] + 1);
}

/**
 * create an object index
 * @param obj object to be indexed
 * @param extractor
 * @returns key-value pairs to the object
 */
export const indexObject = (obj: { [key: string]: any; }, extractor: (value: any) => number) => {
  var index: Array<{ k: string; v: number; }> = [];

  Object.keys(obj).forEach(function (k) {
    index.push({ k: k, v: extractor(obj[k]) });
  });

  return index.sort(function (o1: { k: string; v: number; }, o2: { k: string; v: number; }) {
    return o1.v - o2.v;
  });
}

export const _defaultComparitor = () => {
  let indexMode: boolean;
  let indexModeSearch: boolean;
  let stringMode: boolean;
  return function (v: any, search: any) {
    // support the object format of generated indexes
    if (indexMode === undefined) {
      if (typeof v === 'object' && v.hasOwnProperty('v')) indexMode = true;
      if (typeof search === 'object' && search.hasOwnProperty('v')) indexModeSearch = true
    }

    if (indexMode) v = v.v;
    if (indexModeSearch) search = search.v;

    if (stringMode === undefined) {
      stringMode = false
      if (typeof search === 'string' || typeof v === "string") {
        stringMode = true
      }
    }

    if (stringMode) v = v + ''

    return v > search ? 1 : v < search ? -1 : 0
  };
};

function bsInner<T, V>(arr: T[], search: V, comparitor: Comparitor<T, V>) {

  var max = arr.length - 1, min = 0, middle, cmp;
  // continue searching while key may exist
  while (max >= min) {
    middle = mid(min, max);

    cmp = comparitor(arr[middle], search, middle);

    if (cmp < 0) {
      min = middle + 1;
    } else if (cmp > 0) {
      max = middle - 1;
    } else {
      return middle;
    }
  }
  // key not found
  return -1;
}

function bsclosest<T, V>(arr: T[], search: V, comparitor: Comparitor<T, V>, invert: boolean, closest: boolean) {
  var mids = {}
    , min = 0, max = arr.length - 1, middle, cmp
    , sanity = arr.length;

  while (min < max) {
    middle = midCareful(min, max, mids);
    cmp = comparitor(arr[middle], search, middle);
    if (invert) {
      if (cmp > 0) max = middle - 1;
      else min = middle;
    } else {
      if (cmp < 0) min = middle + 1;
      else max = middle;
    }
    if (!--sanity) break;
  }

  if (max == min && comparitor(arr[min], search) === 0) return min;

  if (closest) {
    var match = comparitor(arr[min], search);
    if (min == arr.length - 1 && match < 0) return min;
    if (min == 0 && match > 0) return 0;

    return closest ? (invert ? min + 1 : min - 1) : -1;
  }
  return -1;
}

function mid(v1: number, v2: number): number {
  return v1 + Math.floor((v2 - v1) / 2);
}

function midCareful(v1: number, v2: number, mids: { [key: number]: number; }): number {
  var mid = v1 + Math.floor((v2 - v1) / 2);
  if (mids[mid]) mid = v1 + Math.ceil((v2 - v1) / 2);
  mids[mid] = 1;
  return mid;
}
