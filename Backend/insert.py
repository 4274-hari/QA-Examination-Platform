import os
from pymongo import MongoClient
import json

mongo_uri = "mongodb://localhost:27017/"
db_name = "VEC"
client = MongoClient(mongo_uri)
db = client[db_name]
logsdb = client["LOGS_VEC"]

def insert_student():
    collection = db["student"]

    with open("Backend/docs/student.json", "r", encoding="utf-8") as file:
        student_data = json.load(file)

    # Direct insert (normal insert)
    collection.insert_many(student_data)

    print("students data inserted successfully.")



def insert_qa_form():
    collection = db["qa_form"]

    with open("Backend/docs/qa_form.json", "r", encoding="utf-8") as file:
        student_data = json.load(file)

    # Direct insert (normal insert)
    collection.insert_many(student_data)

    print("qa_form inserted successfully.")


def insert_qa_question():
    collection = db["qa_question"]

    with open("Backend/docs/qa_question.json", "r", encoding="utf-8") as file:
        student_data = json.load(file)

    # Direct insert (normal insert)
    collection.insert_many(student_data)

    print("qa_question inserted successfully.")


def insert_staff():
    collection = db["staff"]

    with open("Backend/docs/staff.json", "r", encoding="utf-8") as file:
        student_data = json.load(file)

    # Direct insert (normal insert)
    collection.insert_many(student_data)

    print("staff inserted successfully.")


insert_qa_form()
insert_student()
insert_qa_question()
insert_staff()


