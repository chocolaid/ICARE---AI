from flask import Flask, request, render_template, render_template_string, jsonify
import numpy as np
import io, os
from PIL import Image
from flask_wtf import FlaskForm
from wtforms import SubmitField, FileField
from wtforms.validators import DataRequired
from werkzeug.utils import secure_filename
import uuid as uuid
from keras._tf_keras.keras.models import load_model

app = Flask(__name__)
app.config['SECRET_KEY'] = 'DaticanSecreteKey'
app.config['UPLOAD_FOLDER'] = 'static'
model = load_model('Jarvis2.h5')
model.make_predict_function() # Necessary for Flask

# Define the classes dictionary
classes = {
    0: ('akiec', 'actinic keratoses and intraepithelial carcinomae'),
    1: ('bcc' , 'basal cell carcinoma'),
    2: ('bkl', 'benign keratosis-like lesions'),
    3: ('df', 'dermatofibroma'),
    4: ('nv', 'melanocytic nevi'),
    5: ('vasc', ' pyogenic granulomas and hemorrhage'),
    6: ('mel', 'melanoma'),
}

class UploadForm(FlaskForm):
    image = FileField('Image', validators=[DataRequired()])
    submit = SubmitField("Submit")

@app.route('/', methods=['POST', 'GET'])
def predict():
    form = UploadForm()
    if request.method == 'POST' and form.validate_on_submit():
        file = form.image.data
        if file:
            # Generate a unique filename to avoid overwriting
            pic_filename = secure_filename(file.filename)
            pic_name = str(uuid.uuid1()) + '_' + pic_filename
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], pic_name))
            
            try:
                # Load the image using PIL (Python Imaging Library)
                with open(os.path.join(app.config['UPLOAD_FOLDER'], pic_name), 'rb') as img_file:
                    img = Image.open(img_file)
                    img = img.resize((28, 28))  # Resize the image if needed
                    img_array = np.array(img)
                    
                    # Ensure the image has 3 channels (RGB)
                    if img_array.shape[2] == 4:
                        img_array = img_array[:, :, :3]
                    
                    # Reshape the image array if necessary (depends on your model input shape)
                    img_array = img_array.reshape(-1, 28, 28, 3)
                    
                    # Predict using the model
                    result = model.predict(img_array)
                    print(result)
                    
                    # Determine the class index with highest probability
                    class_ind = np.argmax(result)
                    
                    # Render template with prediction result
                    return render_template('index2.html', class_ind=class_ind, classes=classes, pic_name=pic_name, form=form)
            except Exception as e:
                return render_template_string(f"<h1>Error processing image: {e}</h1>")
    else:

    # Render the initial form if GET request or form is invalid
        return render_template('index2.html', form=form, classes=classes)

if __name__ == '__main__':
    app.run(debug=True, port=8900)
