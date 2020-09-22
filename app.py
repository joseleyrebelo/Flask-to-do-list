import dns
import json
import sass
import pymongo
from flask import Flask
from flask import jsonify
from flask import request
from flask import make_response
from flask import render_template
from bson.objectid import ObjectId

app = Flask(__name__)

# Compile Sass
sass.compile(dirname=("static/sass", "static/css"), output_style="compressed")

# Declare MongoDB config
usr = "clust1"
pwd = "todolist"
mongo_db_name = "db1"
mongo_collection_name = "todolists"

# Initiate MongoDB client
client = pymongo.MongoClient(
    "mongodb+srv://"
    + usr
    + ":"
    + pwd
    + "@cluster0.9uste.mongodb.net/db1?retryWrites=true&w=majority"
)

# Select DB - only one on this project
db = client[mongo_db_name]
# Select collection - only one on this project
collection = db[mongo_collection_name]


# Route - Home Page
@app.route("/")
def home_page():
    total = 0
    done = 0

    # Gets all entries(referred on MongoDB as documents) in the colllection
    documents = collection.find()
    for document in documents:
        total += 1
        if document["done"]:
            done += 1

    # Calculate details to be used on this route views
    percentage = round(done / total * 100)
    left = total - done
    details = {"percentage": percentage, "doneEntries": done, "leftEntries": left}

    # Returns views
    return render_template("index.html", details=details)


# Route - Todo List Page
@app.route("/todolist")
def todolist_page():
    documents = collection.find()
    response = []

    # Sorts data from Cursor object
    for document in documents:
        document["_id"] = str(document["_id"])
        response.append(document)

    # Returns views
    return render_template("todolist.html", todos=response)


#
#
# API Routes
# * Rest API, design for the use within this application to emulate no refresh UX

# Route - API - Create new entry (POST)
@app.route("/api", methods=["POST"])
def api_create_todo():
    # Sort data from request
    data = json.loads(request.data.decode("UTF-8"))

    # Running create/insert query
    object_id = collection.insert_one(
        {"task": data["task"], "notes": data["notes"], "done": data["done"]}
    )

    # Sorting data to be return
    if object_id.inserted_id:

        # Sort id of the added todo entry
        id = str(object_id.inserted_id)

        reply = {"success": True, "id": id}

    else:
        reply = {"success": False}

    # Building response
    response = app.response_class(
        response=json.dumps(reply),
        status=200,
        mimetype="application/json",
    )
    return response


# Route - API - Delete todo entry (DELETE)
@app.route("/api/<id>", methods=["DELETE"])
def api_delete_todo(id):

    # Running delete query
    result = collection.delete_one({"_id": ObjectId(id)})

    # Sorting data to be return
    if result.deleted_count >= 1:
        reply = {"success": True, "id": id}
    else:
        reply = {"success": False, "id": id}

    # Building response
    response = app.response_class(
        response=json.dumps(reply),
        status=200,
        mimetype="application/json",
    )
    return response


@app.route("/api/<id>", methods=["PATCH"])
def api_update_todo(id):
    # Sort data from request
    data = json.loads(request.data.decode("UTF-8"))
    print(data)

    # Running update query
    result = collection.update_one(
        {"_id": ObjectId(str(id))},
        {"$set": {"task": data["task"], "notes": data["notes"], "done": data["done"]}},
    )

    # Sorting data to be return
    if result.modified_count >= 1:
        reply = {"success": True, "id": id}
    else:
        reply = {"success": False, "id": id}

    # Building response
    response = app.response_class(
        response=json.dumps(reply),
        status=200,
        mimetype="application/json",
    )
    return response
