from flask import Flask, request, flash, make_response, render_template_string
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

app = Flask(__name__)


#Sqlalchemy config
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
db = SQLAlchemy(app)


class Users(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    firstname = db.Column(db.String(128), nullable=False)
    surname = db.Column(db.String(128), nullable=False)
    lastname = db.Column(db.String(128), nullable=True)
    email = db.Column(db.String(128), nullable=False, unique=True)
    phone = db.Column(db.String(128), nullable=False, unique=True)
    password = db.Column(db.String(128), nullable=False)
    date_added = db.Column(db.DateTime, nullable=False, default=datetime.now())

    def __repr__(self):
        return '<User {}>'.format(self.firstname)
    
@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        user_data = request.get_json()
        firstname = user_data['firstname']
        surname = user_data['surname']
        lastname = user_data['lastname']
        email = user_data['email']
        phonenumber = user_data['phone']
        password = user_data['password']
        users = Users(firstname=firstname, surname=surname, lastname=lastname, email=email, phone=phonenumber, password=password)
        try:
            db.session.add(users)
            db.session.commit()
            return make_response("User Added", 200)
        except:
            flash("Error!!!, Please try again later")
            return make_response("Bad Request - User Not Added", 400)
    return make_response("Only Post Request Are allowed")

@app.route('/', methods=['GET'])
def display():
    shows = Users.query.order_by(Users.id).all()
    return render_template_string(
        '''
        <h1>
        {% for show in shows%}<br/>
        Firstname - {{show.firstname}}<br/>
        Surname - {{show.surname}}<br/>
        Lastname - {{show.lastname}}<br/>
        email - {{show.email}}<br/>
        Phone Number - {{show.phone}}<br/>
        Password - {{show.password}}<br/>
        {%endfor%}<br/>
        </h1>
        ''', shows=shows

    )

if __name__ == "__main__":
    app.run(debug=True, port=6767)