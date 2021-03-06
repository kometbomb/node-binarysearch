
@kometbomb/binarysearch
============

## Note about TS

This is a Typescript conversion of Ryan Day's @kometbomb/binarysearch package. No functionality has been changed outside of replacing the default export. The main addition are the type definitions.

Usage is still as simple as:

```ts
import { bs, closest } from "@kometbomb/binarysearch";

bs([1,4,7,9,22,100,1000],7) === 2
closest([1,2,4,5,6],3) === 1
```

pure js binary search for sorted javascript arrays||array like objects. returns any || last || first || closest matched key for value, or slice between 2 values where values need not exist.

returns the matched key or -1 if not found.

example
=======

```js
// HOX: The default export has been removed so .bs has to be used
var bs = require('@kometbomb/binarysearch').bs;

bs([1,4,7,9,22,100,1000],7) === 2
//true

bs([1],5) === -1
// true

```

search with user defined comparator function

```js
bs([5,6,7,8,9],9,function(value,find){
  if(value > find) return 1;
  else if(value < find) return -1;
  return 0;
}) === 4
// true

```

find first key that matches

```js
var bs = require('@kometbomb/binarysearch');
bs.first([0,1,2,3,3,3,4],3) === 3

```

find last key that matches

```js
bs.last([0,1,2,3,3,3,4],3) === 5

```

find closest key to where or key of searched value in the array
  - if the key is in the array the key will point to
    - the first key that has that value by default
    - the last key that has that value if {end:true} option is specified
  - only returns -1 if array is empty

```js

bs.closest([1,2,4,5,6],3) === 1
bs.closest([1,2,4,5,6],0) === 0
bs.closest([1,2,4,5,6],200) === 6

// non unique matching/matching at end of series
bs.closest([1,2,4,5,5,5,6],5) === 3
bs.closest([1,2,4,5,5,5,6],5,{end:true}) === 5

```

query for rangeValue (inclusive). returns sliced values.

```js
bs.rangeValue([1,2,3,3,3,4,4,6],3,5) === [3,3,3,4,4]

```

or simply access the array offsets directly as [start,end]

```js
bs.range([1,2,3,3,3,4,4,6],3,5) === [2,6]

```

insert a value into a sorted array.

```js
var arr = [1,3,4];
bs.insert(arr,2) === 1
// returns the key it inserted into

arr[1] === 2
// true

```
when you insert values and there are duplicates the default behavior is to insert the new value after the other same values.
if you pass option.unique = true the key's value is replaced with the new value

```js
var arr = [1,2,3];
bs.insert(arr,2)
// arr is [1,2,2,3]

var arr = [1,2,3];
bs.insert(arr,2,{unique:true});
// arr is [1,2,3]

```

insert with user defined comparator function

```js
var arr = [5,6,7,8,9];
bs.insert(arr,10,function(value,add){
  if(value > add) return 1;
  else if(value < add) return -1;
  return 0;
});
// arr is [5,6,7,8,9,10]

```

create an object index

```js

var index = bs.indexObject({a:2,b:1});
// [{k:'b',v:1},{k:a,v:2}];

```

search an object index

```js
var obj = {a:{id:22,name:'bob'},b:{id:11,name:'joe'}};
// [{k:'b',v:11},{k:'a',v:22}];

index = bs.indexObject(obj,function(o1,o2){
  if(o1.id > o2.id) return 1
  else if(o1.id < o2.id) return -1;
  return 0;
});

obj[bs(index,'bob').k] === {id:22,name:'bob'};

```


