const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
app.use(express.json());
let db = null;
const dateFns = require("date-fns");
const format = require("date-fns/format");

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//API 1

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasPriorityAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasCategoryAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};
const hasCategoryAndPriorityProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};
const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const convertFunction = (result) => {
  return {
    id: result.id,
    todo: result.todo,
    priority: result.priority,
    status: result.status,
    category: result.category,
    dueDate: result.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  const { status, priority, category, todo, search_q = "" } = request.query;
  let getQuery = "";
  let getQueryResult;
  switch (true) {
    case hasPriorityAndStatusProperty(request.query):
      getQuery = `
            SELECT
            *
            FROM 
            todo
            WHERE todo LIKE "%${search_q}%"
            AND status = "${status}"
            AND priority = "${priority}"; 
            `;
      getQueryResult = await db.all(getQuery);
      response.send(
        getQueryResult.map((eachResult) => convertFunction(eachResult))
      );
      break;
    case hasCategoryAndStatusProperty(request.query):
      getQuery = `
            SELECT
            *
            FROM 
            todo
            WHERE todo LIKE "%${search_q}%"
            AND status = "${status}"
            AND category = "${category}"; 
            `;
      getQueryResult = await db.all(getQuery);
      response.send(
        getQueryResult.map((eachResult) => convertFunction(eachResult))
      );
      break;
    case hasCategoryAndPriorityProperty(request.query):
      getQuery = `
            SELECT
            *
            FROM 
            todo
            WHERE todo LIKE "%${search_q}%"
            AND category = "${category}"
            AND priority = "${priority}"; 
            `;
      getQueryResult = await db.all(getQuery);
      response.send(
        getQueryResult.map((eachResult) => convertFunction(eachResult))
      );
      break;
    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getQuery = `
            SELECT
            *
            FROM 
            todo
            WHERE todo LIKE "%${search_q}%"
            AND status = "${status}"; 
            `;
        getQueryResult = await db.all(getQuery);
        response.send(
          getQueryResult.map((eachResult) => convertFunction(eachResult))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getQuery = `
            SELECT
            *
            FROM 
            todo
            WHERE todo LIKE "%${search_q}%"
            AND priority = "${priority}"; 
            `;
        getQueryResult = await db.all(getQuery);
        response.send(
          getQueryResult.map((eachResult) => convertFunction(eachResult))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getQuery = `
            SELECT
            *
            FROM 
            todo
            WHERE todo LIKE "%${search_q}%"
            AND category = "${category}"; 
            `;
        getQueryResult = await db.all(getQuery);
        response.send(
          getQueryResult.map((eachResult) => convertFunction(eachResult))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    default:
      getQuery = `
            SELECT
            *
            FROM 
            todo
            WHERE todo LIKE "%${search_q}%" 
            `;
      getQueryResult = await db.all(getQuery);
      response.send(
        getQueryResult.map((eachResult) => convertFunction(eachResult))
      );
      break;
  }
});

//API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getIdQuery = `
    SELECT
    *
    FROM
    todo
    WHERE
    id = ${todoId};
    `;
  const getIdResult = await db.get(getIdQuery);
  response.send(convertFunction(getIdResult));
});

//API 3

app.get("/agenda/", async (request, response) => {
  let { date } = request.query;
  date = format(new Date(date), "yyyy-MM-dd");
  //console.log(date);
  const getDateQuery = `
    SELECT
    *
    FROM
    todo
    WHERE
    due_date = "${date}";
    `;
  const getDateResult = await db.all(getDateQuery);
  //console.log(getDateResult);
  response.send(getDateResult.map((each) => convertFunction(each)));
});

//API 4

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (
    status !== "TO DO" ||
    status !== "IN PROGRESS" ||
    status !== "DONE" ||
    status !== undefined
  ) {
    response.status(400);
    response.send("Invalid Todo Status");
  }
  if (
    priority !== "HIGH" ||
    priority !== "MEDIUM" ||
    priority !== "LOW" ||
    priority !== undefined
  ) {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
  if (
    category !== "WORK" ||
    category !== "HOME" ||
    category !== "LEARNING" ||
    category !== undefined
  ) {
    response.status(400);
    response.send("Invalid Todo Category");
  }
  const addNewQuery = `
    INSERT INTO
    todo (id, todo, priority, status, category, due_date)
    VALUES (
        ${id},
        "${todo}",
        "${priority}",
        "${status}",
        "${category}",
        "${dueDate}"
    );
    `;
  await db.run(addNewQuery);
  response.send("Todo Successfully Added");
});

//API 5

const isStatus = (requestBody) => {
  return requestBody.status !== undefined;
};
const isPriority = (requestBody) => {
  return requestBody.priority !== undefined;
};
const isTodo = (requestBody) => {
  return requestBody.todo !== undefined;
};
const isCategory = (requestBody) => {
  return requestBody.category !== undefined;
};
const isDueDate = (requestBody) => {
  return requestBody.dueDate !== undefined;
};

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { status, priority, todo, category, dueDate } = request.body;
  let updateQuery = "";
  switch (true) {
    case isStatus(request.body):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateQuery = `
          UPDATE
          todo
          SET
          status = "${status}";
          `;
        await db.run(updateQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case isPriority(request.body):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updateQuery = `
          UPDATE
          todo
          SET
          priority = "${priority}";
          `;
        await db.run(updateQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case isTodo(request.body):
      updateQuery = `
          UPDATE
          todo
          SET
          todo = "${todo}";
          `;
      await db.run(updateQuery);
      response.send("Todo Updated");
      break;
    case isCategory(request.body):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateQuery = `
          UPDATE
          todo
          SET
          category = "${category}";
          `;
        await db.run(updateQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;
    case isDueDate(request.body):
      updateQuery = `
          UPDATE
          todo
          SET
          due_date = "${dueDate}";
          `;
      await db.run(updateQuery);
      response.send("Due Date Updated");
      break;

    default:
      break;
  }
});

//API 6

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
    DELETE FROM
    todo
    WHERE
    id = ${todoId};
    `;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
