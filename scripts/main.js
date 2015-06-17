var app = angular.module("evercamApp", [])

var noCatgeory = "Misc"
var spec = [
    {name: "API Wrappers", repos: ["evercam-node", "evercam-ruby", "evercam.js", "evercam-objc", "evercam-elixir", "evercam.net", "evercam.java", "evercam.py"]},
    {name: "Camera access", repos: ["evercam-media", "evercam-gateway", "camera-gateway-api"]},
    {name: "Android apps", repos: ["evercam-play-android", "evercam-wear-android", "evercam-capture-android", "evercam-bigredsnapshot-android", "evercam-glass-android", "evercam-discover-android"]},
    {name: "iOS apps", repos: ["evercam-play-ios"]},
    {name: "Cambase", repos: ["cambase", "CambaseOLD"]},
    {name: "Dashboard", repos: ["evercam-dashboard", "evercam-public-site"]}
]

function getCategory(categories, repo) {
    for (cat in categories) {
        if (categories[cat].indexOf(repo) > -1) return cat
    }
    return noCatgeory
}

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
    for (var repo in data[noCatgeory]) {
        miscrepos.push(data[noCatgeory][repo])
    }
    ordered.push({name: noCatgeory, repos: miscrepos})
    return ordered
}

app.controller("repoCtrl", function($http, $scope) {
    $http.get("/repositories.json").success(function(repo) {
        // Given spec prepare obvjrects with categories as keys
        var data = {}, categories = {}
        for (var i = 0; i < spec.length; i++) {
            data[spec[i].name] = {}
            categories[spec[i].name] = spec[i].repos
        }
        data[noCatgeory] = {}

        // Sort data by categories
        for (var i = 0; i < repo.length; i++) {
            var name = repo[i].name
            data[getCategory(categories, name)][name] = repo[i]
        }

        $scope.categories = reorderToTop(categories, data)
    }).error(function(data, stat) {
        alert("Error occured")
    })
})
