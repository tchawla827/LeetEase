import os

from flask_jwt_extended import JWTManager
from flask_session import Session
from flask_bcrypt import Bcrypt
from flask_mail import Mail
from flask_wtf import CSRFProtect

# Initialize Flask extensions (to be called in app factory)
jwt = JWTManager()
sess = Session()
bcrypt = Bcrypt()
mail = Mail()
csrf = CSRFProtect()
