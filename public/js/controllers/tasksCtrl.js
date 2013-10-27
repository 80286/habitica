"use strict";

habitrpg.controller("TasksCtrl", ['$scope', '$rootScope', '$location', 'User', 'Algos', 'Helpers', 'Notification',
  function($scope, $rootScope, $location, User, Algos, Helpers, Notification) {
    $scope.score = function(task, direction) {
      if (task.type === "reward" && User.user.stats.gp < task.value){
        return Notification.text('Not enough GP.');
      }
      Algos.score(User.user, task, direction);
      User.log({op: "score",data: task, dir: direction});

    };

    $scope.addTask = function(list) {
      var task = window.habitrpgShared.helpers.taskDefaults({text: list.newTask, type: list.type}, User.user.filters);
      list.tasks.unshift(task);
      User.log({op: "addTask", data: task});
      delete list.newTask;
    };

    /**
     * Add the new task to the actions log
     */
    $scope.clearDoneTodos = function() {};

    /**
     * This is calculated post-change, so task.completed=true if they just checked it
     */
    $scope.changeCheck = function(task) {
      if (task.completed) {
        $scope.score(task, "up");
      } else {
        $scope.score(task, "down");
      }
    };
    /* TODO this should be somewhere else, but fits the html location better here
     */

    // uhoh! our first name conflict with habitrpg-shared/helpers, we gotta resovle that soon.
    $rootScope.clickRevive = function() {
      window.habitrpgShared.algos.revive(User.user);
      User.log({ op: "revive" });
    };

    $scope.removeTask = function(list, $index) {
      if (!confirm("Are you sure you want to delete this task?")) return;
      User.log({ op: "delTask", data: list[$index] });
      list.splice($index, 1);
    };

    $scope.saveTask = function(task) {
      var setVal = function(k, v) {
        var op;
        if (typeof v !== "undefined") {
          op = { op: "set", data: {} };
          op.data["tasks." + task.id + "." + k] = v;
          return log.push(op);
        }
      };
      var log = [];
      setVal("text", task.text);
      setVal("notes", task.notes);
      setVal("priority", task.priority);
      setVal("tags", task.tags);
      if (task.type === "habit") {
        setVal("up", task.up);
        setVal("down", task.down);
      } else if (task.type === "daily") {
        setVal("repeat", task.repeat);
        // TODO we'll remove this once rewrite's running for a while. This was a patch for derby issues
        setVal("streak", task.streak);

      } else if (task.type === "todo") {
        setVal("date", task.date);
      } else {
        if (task.type === "reward") {
          setVal("value", task.value);
        }
      }
      User.log(log);
      task._editing = false;
    };

    /**
     * Reset $scope.task to $scope.originalTask
     */
    $scope.cancel = function() {
      var key;
      for (key in $scope.task) {
        $scope.task[key] = $scope.originalTask[key];
      }
      $scope.originalTask = null;
      $scope.editedTask = null;
      $scope.editing = false;
    };

    /*
     ------------------------
     Items
     ------------------------
     */

    var updateStore = function(){
      var sorted, updated;
      updated = window.habitrpgShared.items.updateStore(User.user);
      /* Figure out whether we wanna put this in habitrpg-shared
       */

      sorted = [updated.weapon, updated.armor, updated.head, updated.shield, updated.potion, updated.reroll];
      $scope.itemStore = sorted;
    }

    updateStore();

    $scope.buy = function(type) {
      var hasEnough = window.habitrpgShared.items.buyItem(User.user, type);
      if (hasEnough) {
        User.log({op: "buy",type: type});
        Notification.text("Item purchased.");
        updateStore();
      } else {
        Notification.text("Not enough GP.");
      }
    };

    $scope.clearCompleted = function() {
      User.user.todos = _.reject(User.user.todos, {completed:true});
      User.log({op: 'clear-completed'});
    }

    /**
     * See conversation on http://productforums.google.com/forum/#!topic/adsense/WYkC_VzKwbA,
     * Adsense is very sensitive. It must be called once-and-only-once for every <ins>, else things break.
     * Additionally, angular won't run javascript embedded into a script template, so we can't copy/paste
     * the html provided by adsense - we need to run this function post-link
     */
    $scope.initAds = function(){
      $.getScript('//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js');
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    }

  }]);
