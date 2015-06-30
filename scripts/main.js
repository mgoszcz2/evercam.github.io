// Config
var noCatgeory = "Misc"
var showMisc = false;
var spec = [
    {name: "Wrappers", repos: ["evercam-node", "evercam-ruby", "evercam.js", "evercam-objc", "evercam-elixir", "evercam.net", "evercam.java", "evercam.py"]},
    {name: "Server", repos: ["evercam-api", "evercam-media", "evercam-gateway", "camera-gateway-api"]},
    {name: "Clients", repos: ["evercam-dashboard", "evercam-public-site", "evercam-play-ios", "evercam-play-android"]}
]

// Horrible race conditions hack
var global = null
var scope = null
var timeout = null

// Angular set-up
var app = angular.module("evercamApp", []);
app.controller("repoCtrl", function($scope, $timeout) {
    timeout = $timeout
    scope = $scope
    attemptUpdate(false)
})

// JSONP callback from S3
function readData(data) {
    var obj = {}
    obj.categories = handleRepositories(data.repositories)
    obj.contributors = data.contributors
    obj.issues = data.issues
    global = obj
    attemptUpdate(true)
}

// Called at end of angular scope setup and JSONP load
// Only triggers if both have been loaded
function attemptUpdate(outsideDigest) {
    console.log(outsideDigest, scope, global);
    if (scope && global) {
        for (var key in global) {
            scope[key] = global[key]
        }
        if (outsideDigest) {
            scope.$digest()
        }
        console.log("Sucessful scope update")
        timeout(function() {
            $("#issues").DataTable();
        })
    }
}

// Organise repositories by category
function handleRepositories(repos) {
    var categories = {} // spec with category as key
    var processed = {} // Result

    for (var i = 0; i < spec.length; i++) {
        processed[spec[i].name] = {}
        categories[spec[i].name] = spec[i].repos
    }
    processed[noCatgeory] = {}

    // Sort repos by categories
    for (var i = 0; i < repos.length; i++) {
        var name = repos[i].name
        processed[getCategory(categories, name)][name] = repos[i]
    }

    return reorderToTop(categories, processed)
}

function getCategory(categories, repo) {
    for (cat in categories) {
        if (categories[cat].indexOf(repo) > -1) return cat
    }
    return noCatgeory
}

// Reorder repos to match order in spec
function reorderToTop(categories, data) {
    var ordered = [], miscrepos = []

    // Sort categorised data by spec ordered
    for (var cat in categories) {
        var catrepos = []
        for (var i = 0; i < categories[cat].length; i++) {
            var repo = categories[cat][i]
            if (repo in data[cat]) catrepos.push(data[cat][repo])
        }
        ordered.push({name: cat, repos: catrepos})
    }

    // Eveyrthing goes into misc
    if (showMisc) {
        for (var repo in data[noCatgeory]) {
            miscrepos.push(data[noCatgeory][repo])
        }
        ordered.push({name: noCatgeory, repos: miscrepos})
    }
    return ordered
}
