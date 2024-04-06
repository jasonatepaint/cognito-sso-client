# Dev Test Harness for Webpack Bundling

Used for validating that the webpack bundling works as expected by making sure
that the client can access the UnifiedLogin class.

### To Test:

* `npm run verify-webpack`
* Tests
  * `http://localhost:4000` - This will test the **module** bundle version (used w/import)
  * `http://localhost:4000/index2.html` - This will test the normal bundle (global variable UnifiedLogin)
* Verify in browser console that `UnifiedLogin` is defined and accessible
