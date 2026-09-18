/* Behaviour for the embedded site. Plain DOM, no framework, no network — the
   records live in localStorage so submissions survive navigation. */

(function () {
  "use strict";

  var STORE = "harness-studio.briefs";

  function load() {
    try {
      var raw = window.localStorage.getItem(STORE);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function save(records) {
    try {
      window.localStorage.setItem(STORE, JSON.stringify(records));
    } catch {
      /* Storage can be unavailable in private modes; the page still works. */
    }
  }

  /* ------------------------------------------------------------ brief form */

  var form = document.getElementById("brief-form");

  if (form) {
    var errorBox = document.getElementById("brief-error");

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var title = document.getElementById("brief-title").value.trim();
      var repo = document.getElementById("brief-repo").value;
      var severity = document.getElementById("brief-severity").value;
      var summary = document.getElementById("brief-summary").value.trim();
      var tests = document.getElementById("brief-tests").checked;

      var problems = [];
      if (title.length < 4) problems.push("a title of at least 4 characters");
      if (!repo) problems.push("a package");
      if (summary.length < 12) problems.push("a summary of at least 12 characters");

      if (problems.length) {
        errorBox.textContent = "Please provide " + problems.join(", ") + ".";
        errorBox.hidden = false;
        return;
      }

      errorBox.hidden = true;

      var records = load();
      records.unshift({
        id: "brief-" + Date.now(),
        title: title,
        repo: repo,
        severity: severity,
        summary: summary,
        tests: tests,
        createdAt: new Date().toISOString(),
      });
      save(records);

      window.location.href = "briefs.html";
    });
  }

  /* ------------------------------------------------------------ brief list */

  var list = document.getElementById("brief-list");

  if (list) {
    var empty = document.getElementById("brief-empty");
    var count = document.getElementById("brief-count");

    function render() {
      var records = load();
      list.textContent = "";
      empty.hidden = records.length > 0;
      count.textContent = records.length
        ? "(" + records.length + ")"
        : "";

      records.forEach(function (record) {
        var item = document.createElement("li");
        item.className = "brief";
        item.id = record.id;

        var header = document.createElement("header");
        var heading = document.createElement("h3");
        heading.textContent = record.title;
        var pill = document.createElement("span");
        pill.className = "pill pill-" + record.severity;
        pill.textContent = record.severity;
        header.appendChild(heading);
        header.appendChild(pill);

        var summary = document.createElement("p");
        summary.textContent = record.summary;

        var meta = document.createElement("dl");
        [
          ["Package", record.repo],
          ["Evidence", record.tests ? "included" : "omitted"],
          ["Created", new Date(record.createdAt).toLocaleTimeString()],
        ].forEach(function (pair) {
          var group = document.createElement("div");
          var key = document.createElement("dt");
          key.textContent = pair[0];
          var value = document.createElement("dd");
          value.textContent = pair[1];
          group.appendChild(key);
          group.appendChild(value);
          meta.appendChild(group);
        });

        item.appendChild(header);
        item.appendChild(summary);
        item.appendChild(meta);
        list.appendChild(item);
      });
    }

    document
      .getElementById("brief-clear")
      .addEventListener("click", function () {
        save([]);
        render();
      });

    render();
  }
})();
