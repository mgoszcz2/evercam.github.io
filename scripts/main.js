// Config
var noCatgeory = "Misc"
var showMisc = false;
var onlyBlessedIssues = true;
var miscShort = true;
var spec = [
    {
        name: "Servers",
        repos: ["evercam-api", "evercam-media", "evercam-gateway", "evercam-gateway-api"]
    }, {
        name: "Clients",
        repos: ["evercam-dashboard", "evercam-public-site", "evercam-play-ios", "evercam-play-android"]
    }, {
        name: "Wrappers",
        short: true,
        repos: [
            ["evercam-node", "Node.js"],
            ["evercam-ruby", "Ruby"],
            ["evercam.js", "JavaScript"],
            ["evercam-objc", "Objective-C"],
            ["evercam-elixir", "Elixir"],
            ["evercam.net", ".NET"],
            ["evercam.java", "Java"],
            ["evercam.py", "Python"]
        ]
    }
]

// Horrible race conditions hack
var global = null
var scope = null
var timeout = null

// Simple form-control to datatables
/* Default class modification */
jQuery.extend(jQuery.fn.dataTable.ext.classes, {
	sWrapper:      "dataTables_wrapper form-inline dt-bootstrap",
	sFilterInput:  "form-control input-sm",
	sLengthSelect: "form-control input-sm"
})

// Angular set-up
var app = angular.module("evercamApp", []);
app.controller("repoCtrl", function($scope, $timeout) {
    timeout = $timeout
    scope = $scope
    attemptUpdate(false)
})

// Haskell FTW
function traceShow(obj) {
    console.log(obj)
    return obj
}

// JSONP callback from S3
function readData(data) {
    var obj = {}
    obj.categories = handleRepositories(data.repositories)
    obj.contributors = data.contributors
    obj.issues = handleIssues(data.issues)
    global = obj
    attemptUpdate(true)
}

// Called at end of angular scope setup and JSONP load
// Only triggers if both have been loaded
function attemptUpdate(outsideDigest) {
    if (scope && global) {
        for (var key in global) {
            scope[key] = global[key]
        }
        if (outsideDigest) {
            scope.$digest()
        }
        traceShow("Sucessful scope update")
        timeout(function() {
            $("#issues").DataTable({
                bLengthChange: false,
                pageLength: 16,
                info: false,
                language: {
                    search: '',
                    searchPlaceholder: 'Search'
                }
            });
        })
    }
}

// Get name ignoring alias for spec check
function getName(name) {
    if (typeof name == "string") return name
    return name[0];
}

function getAlias(name) {
    if (typeof name == "string") return name
    return name[1];
}

// Organise repositories by category
function handleRepositories(repos) {
    // Used for putting `repos` into `processed`
    var categories = {}
    // Actual repo objects with catgeory followed
    // by repo name (non-alised) as key
    var processed = {}

    for (var i = 0; i < spec.length; i++) {
        processed[spec[i].name] = {}
        categories[spec[i].name] = spec[i].repos
    }
    processed[noCatgeory] = {}

    // Sort repos by categories
    for (var i = 0; i < repos.length; i++) {
        var name = repos[i].name
        var cat = getCategory(categories, name)
        repos[i].alias = cat.alias
        processed[cat.category][name] = repos[i]
    }

    return reorderToTop(processed)
}

// Only get repos that appear in the spec
function getBlessedRepos() {
    var blessed = [];

    for (var i = 0; i < spec.length; i++) {
        blessed = blessed.concat(spec[i].repos)
    }
    return blessed;
}

// Maybe filter blessed repos
function handleIssues(issues) {
    if (!onlyBlessedIssues) return issues

    var blessed = getBlessedRepos()
    return issues.filter(function(issue) {
        return blessed.indexOf(issue.repository) > -1
    })
}

// Get category and alias of a repo
function getCategory(categories, name) {
    for (cat in categories) {
        var repos = categories[cat]
        for (var i = 0; i < repos.length; i++) {
            if (getName(repos[i]) == name) {
                return {alias: getAlias(repos[i]), category: cat}
            }
        }
    }
    return {alias: name, category: noCatgeory}
}

// Reorder repos to match order in spec
function reorderToTop(data) {
    // Result
    var ordered = []
    // Repositories that don't belong anywhere
    var miscRepos = []

    // Sort categorised data by spec ordered
    for (var i = 0; i < spec.length; i++) {
        var cat = spec[i].name
        var catRepos = []
        for (var j = 0; j < spec[i].repos.length; j++) {
            var repo = getName(spec[i].repos[j])
            if (repo in data[cat]) {
                catRepos.push(data[cat][repo])
            } else {
                console.warn("'" + cat + "' contains non-existant repository " + repo)
            }
        }
        ordered.push({name: cat, repos: catRepos, short: spec[i].short || false})
    }

    // Everything goes into misc
    if (showMisc) {
        for (var repo in data[noCatgeory]) {
            miscRepos.push(data[noCatgeory][repo])
        }
        ordered.push({name: noCatgeory, repos: miscRepos, short: miscShort})
    }
    console.log("Data", ordered)
    return ordered
}
