const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const format = require("date-fns/format");

const isMatch = require("date-fns/isMatch");

var isValid = require("date-fns/isValid");

const app = express();

app.use(express.json());

const databasePath = path.join(__dirname, "todoApplication.db");

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    PROGRESS.exit(1);
  }
};
initializeDbAndServer();

const priorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const priorityProperties = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const statusProperties = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const categoryProperties = (requestQuery) => {
  return;
  requestQuery.category !== undefined;
};

const categoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.category !== undefined
  );
};

const categoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const searchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const convertDataToResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    category: dbObject.category,
    priority: dbObject.priority,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

//API 1

app.get("/todos/", async (request, response) => {
  const { search_q = "", priority, status, category } = request.query;

  let data = null;
  let getTodosQuery = "";

  switch (true) {
    case statusProperties(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodosQuery = `
                SELECT *
                FROM todo
                WHERE status = '${status}';`;
        data = await database.all(getTodosQuery);
        response.send(data.map((each) => convertDataToResponseObject(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case priorityProperties(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodosQuery = `
                SELECT *
                FROM todo
                WHERE priority = '${priority}';`;
        data = await database.all(getTodosQuery);
        response.send(data.map((each) => convertDataToResponseObject(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case priorityAndStatusProperties(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `
                    SELECT *
                    FROM todo
                    WHERE priority = '${priority}' AND status = '${status}';`;
          data = await database.all(getTodosQuery);
          response.send(data.map((each) => convertDataToResponseObject(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case searchProperty(request.query):
      getTodosQuery = `
            SELECT *
            FROM todo
            WHERE todo LIKE '%${search_q}%';`;
      data = await database.all(getTodosQuery);
      response.send(data.map((each) => convertDataToResponseObject(each)));
      break;
    case categoryAndStatusProperties(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `
                    SELECT *
                    FROM todo
                    WHERE category = '${category}' AND status = '${status}';`;
          data = await database.all(getTodosQuery);
          response.send(data.map((each) => convertDataToResponseObject(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case categoryProperties(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodosQuery = `
                SELECT *
                FROM todo
                WHERE category = '${category}';`;
        data = await database.all(getTodosQuery);
        response.send(data.map((each) => convertDataToResponseObject(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case categoryAndPriorityProperties(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getTodosQuery = `
                    SELECT *
                    FROM todo
                    WHERE category = '${category}' AND priority = '${priority}';`;
          data = await database.all(getTodosQuery);
          response.send(data.map((each) => convertDataToResponseObject(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    default:
      getTodosQuery = `
                SELECT *
                FROM todo;`;
      data = await database.all(getTodosQuery);
      response.send(data.map((each) => convertDataToResponseObject(each)));
  }
});

//API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoByIdQuery = `
    SELECT *
    FROM todo
    WHERE id = ${todoId};`;
  const dbById = await database.get(getTodoByIdQuery);
  response.send(convertDataToResponseObject(dbById));
});

//API 3

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    const getDateQuery = `
            SELECT *
            FROM todo
            WHERE due_date = '${newDate}';`;
    const dbDate = await database.all(getDateQuery);
    response.send(dbDate.map((each) => convertDataToResponseObject(each)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//API 4

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const newDate = format(new Date(dueDate), "yyyy-MM-dd");
          const postQuery = `
                    INSERT INTO
                        todo(id,todo,priority,status,category,due_date)
                    VALUES
                        (${id},'${todo}','${priority}','${status}','${category}','${newDate}');`;
          await db.run(postQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

//API 5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  const previousTodoQuery = `
        SELECT *
        FROM todo
        WHERE id = ${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body;
  let updateTodo;
  switch (true) {
    //updating status
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodo = `
                    UPDATE todo
                    SET todo = '${todo}',
                    priority = '${priority}',
                    status = '${status}',
                    category = '${category}',
                    due_date = '${dueDate}',
                    WHERE id = ${todoId};`;
        await database.run(updateTodo);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    //Priority
    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updateTodo = `
                    UPDATE todo
                    SET todo = '${todo}',
                    priority = '${priority}',
                    status = '${status}',
                    category = '${category}',
                    due_date = '${dueDate}',
                    WHERE id = ${todoId};`;
        await database.run(updateTodo);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    //todo
    case requestBody.todo !== undefined:
      updateTodo = `
                    UPDATE todo
                    SET todo = '${todo}',
                        priority = '${priority}',
                        status = '${status}',
                        category = '${category}',
                        due_date = '${dueDate}',
                        WHERE id = ${todoId};`;
      await database.run(updateTodo);
      response.send("Todo Updated");
      break;
    //category
    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodo = `
                    UPDATE todo
                    SET todo = '${todo}',
                        priority = '${priority}',
                        status = '${status}',
                        category = '${category}',
                        due_date = '${dueDate}',
                        WHERE id = ${todoId};`;
        await database.run(updateTodo);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    //time
    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateTodo = `
                    UPDATE todo
                    SET todo = '${todo}',
                        priority = '${priority}',
                        status = '${status}',
                        category = '${category}',
                        due_date = '${dueDate}',
                        WHERE id = ${todoId};`;
        await database.run(updateTodo);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

//API 6

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
    DELETE
    FROM todo
    WHERE 
        id = ${todoId};`;
  await database.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
