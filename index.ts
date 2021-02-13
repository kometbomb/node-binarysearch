interface Options {
  end?: boolean;
  exists?: boolean;
  unique?: boolean;
}

type Comparitor<T, V = T> = (value: T, find: V, x?: any) => number;

export const bs = <T, V>(arr: T[], search: V, comparitor?: Comparitor<T, V>) => {
  if (!arr) return -1;
  // as long as it has a length i will try and itterate over it.
  if (arr.length === undefined) return -1;

  if (!comparitor) comparitor = _defaultComparitor();

  return bsInner(arr, search, comparitor);
}

export const first = <T, V>(arr: T[], search: V, comparitor?: Comparitor<T, V>) => {
  return closest(arr, search, { exists: true }, comparitor);
}

export const last = <T, V>(arr: T[], search: V, comparitor?: Comparitor<T, V>) => {
  return closest(arr, search, { exists: true, end: true }, comparitor);
}

export const closest = <T, V>(arr: T[], search: V, opts: Options | Comparitor<T, V>, comparitor?: Comparitor<T, V>) => {

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

// inserts element into the correct sorted spot into the array
export const insert = <T>(arr: T[], search: T, opts?: Options, comparitor?: Comparitor<T, T>) => {

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

// this method returns the start and end indicies of a range. [start,end]
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

// this method returns the values of a range;
export const rangeValue = <T, V>(arr: T[], from: V, to: V, comparitor?: Comparitor<T, V>) => {
  var rangeArray = range(arr, from, to, comparitor);
  return arr.slice(rangeArray[0], rangeArray[1] + 1);
}

//
export const indexObject = (o: { [key: string]: any; }, extractor: (value: any) => number) => {
  var index: Array<{ k: string; v: number; }> = [];

  Object.keys(o).forEach(function (k) {
    index.push({ k: k, v: extractor(o[k]) });
  });

  return index.sort(function (o1: { k: string; v: number; }, o2: { k: string; v: number; }) {
    return o1.v - o2.v;
  });
}

export const cmp = (v1: number, v2: number) => {
  return v1 - v2;
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

module.exports._binarySearch = bsInner;
module.exports._binarySearchClosest = bsclosest;

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
