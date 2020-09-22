$(document).ready(function () {
  const API_ENDPOINT = "http://localhost:5000/api";
  const fetch = window.fetch.bind(window);

  // Get task (description) from input
  const getTodoTaskValue = () => {
    // Default value is False
    // * Will be checked for as fail flag
    let result = false;
    let task = $(".todo__main-task").val();

    // tenary condition updating result with task if it's not empty
    result = task !== "" ? task : result;

    return result;
  };

  // Error visualisation on new todo form
  const showFormError = () => {
    let $form = $(".todo__main");
    $form.addClass("error");
    setTimeout(() => {
      $form.removeClass("error");
    }, 3000);
  };

  const createEntryUI = (data) => {
    // Build string of element to be
    let build = `
      <div
        class="todo__entry"
        todo_entry="${data.id}"
        >
        <span
          class="todo__entry-tick"
          target_id="${data.id}"
        >
          <span class="material-icons">check</span>
        </span>
        <div class="todo__entry-text">${data.task}</div>
        <div class="todo__entry-actions">
          <span
            target_id="${data.id}"
            class="material-icons todo__entry-delete-control"
            >remove
          </span>
        </div>
      </div>
    `;

    // Add element to ".todo__list" container
    $(".todo__list").append(build);

    // Select the new element
    $new = $(".todo__list > .todo__entry").last();

    //
    // Bind listeners to child (controls)
    $new.find(".todo__entry-delete-control").click((e) => {
      deleteEntry(e);
    });
    $new.find(".todo__entry-tick").click((e) => {
      toggleDoneEntry(e);
    });
  };

  // Add new entry to database
  const createEntry = () => {
    let task = getTodoTaskValue();

    // Validate result coming from "getTodoTaskValue"
    // * False means failure
    if (!task) {
      showFormError();
    } else {
      fetch(`${API_ENDPOINT}`, {
        method: `POST`,
        body: JSON.stringify({
          task: task,
          notes: "",
          done: false,
        }),
        headers: { "Content-Type": "application/json" },
      })
        .then((response) => {
          return response.json();
        })
        .then((response) => {
          if (response.success) {
            // Adds todo entry to UI
            createEntryUI({
              task: task,
              id: response.id,
            });
            // Clears form input
            $(".todo__main-task").val("");
          } else {
            console.log(`Failed to add new todo: ${task}`);
          }
        });
    }
  };

  const deleteEntry = (e) => {
    $el = $(e.target);
    fetch(`${API_ENDPOINT}/${$el.attr("target_id")}`, {
      method: `DELETE`,
    })
      .then((response) => {
        return response.json();
      })
      .then((response) => {
        if (response.success) {
          // Removes entry from UI
          $(`[todo_entry="${response.id}"]`).remove();
        } else {
          console.log(`Failed to delete entry of id ${response.id}`);
        }
      });
  };

  const toggleDoneEntry = (e) => {
    $el = $(e.target);
    $entry_el = $el.closest(".todo__entry");

    // Sorting data necessary to fetch operation
    id = $el.attr("target_id");
    task = $entry_el.find(".todo__entry-text").text();
    done = !$entry_el.hasClass("done");

    fetch(`${API_ENDPOINT}/${id}`, {
      method: `PATCH`,
      body: JSON.stringify({
        task: task,
        notes: "",
        done: done,
      }),
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => {
        return response.json();
      })
      .then((response) => {
        if (response.success) {
          // Updates UI according to state of done
          // * This is reflect the task as done or not
          if (done) {
            $(`[todo_entry="${response.id}"]`).addClass("done");
          } else {
            $(`[todo_entry="${response.id}"]`).removeClass("done");
          }
        } else {
          console.log(`Failed to update entry of id ${response.id}`);
        }
      });
  };

  //
  // Initial bind of listeners to page elements
  $("#todo__add").submit((e) => {
    e.preventDefault();
    createEntry();
  });
  $(".todo__main-submit").click((e) => {
    e.preventDefault();
    $("#todo__add").trigger("submit");
  });

  $(".todo__entry-delete-control").click((e) => {
    deleteEntry(e);
  });

  $(".todo__entry-tick").click((e) => {
    toggleDoneEntry(e);
  });

  $(".app__show-control").click(function () {
    let $text = $(this).find(".app__show-control-text");
    let $todoList = $(".todo__list");
    if ($todoList.hasClass("show-done")) {
      $todoList.removeClass("show-done");
      $text.html("Show Done");
    } else {
      $todoList.addClass("show-done");
      $text.html("Hide Done");
    }
  });
});
