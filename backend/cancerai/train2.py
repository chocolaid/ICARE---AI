from flask import Flask, request, render_template, render_template_string, jsonify, Response, make_response
import numpy as np
import io, os, json
from PIL import Image
from flask_wtf import FlaskForm
from wtforms import SubmitField, FileField
from wtforms.validators import DataRequired
from werkzeug.utils import secure_filename
import uuid as uuid
from dotenv import load_dotenv
from keras._tf_keras.keras.models import load_model
from datetime import datetime
import base64


load_dotenv()
app = Flask(__name__)
app.config['SECRET_KEY'] = 'DaticanSecreteKey'
app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_FOLDER')
model = load_model('Jarvis2.h5')
model.make_predict_function() # necessary for Flask

class uploadForm(FlaskForm):
    image = FileField('file', validators=[DataRequired()])
    submit = SubmitField('submit')


classes={0:('akiec', 'actinic keratoses and intraepithelial carcinomae'),
         1:('bcc' , 'basal cell carcinoma'),
         2:('bkl', 'benign keratosis-like lesions'),
         3:('df', 'dermatofibroma'),
         4:('nv', 'melanocytic nevi'),
         5:('vasc', ' pyogenic granulomas and hemorrhage'),
         6:('mel', 'melanoma'),}

def model(image):
    img = np.array(image)

    # Reshape the array if needed
    #img = img.reshape(-1, 28, 28, 3)  # Uncomment this line if needed

    '''# Display the image
                plt.imshow(img)
                plt.axis('off')  # Turn off axis labels
                plt.show()'''

                # Rest of your code
    img = np.array(image).reshape(-1, 28, 28, 3)
    result = model.predict(img)
    print(result[0])
    result = result.tolist()
    max_prob = max(result[0])
    class_ind = result[0].index(max_prob)
    return class_ind
    
@app.route('/predict', methods=['POST'])
def predict():
    if request.method == 'POST':
        file = request.data
        if file:
            time = secure_filename(str(datetime.now()))
            path = f'{time}.jpeg'
            decoded_image = base64.b64decode(file)

            # Create a BytesIO object to wrap the decoded bytes
            image_stream = io.BytesIO(decoded_image)

            # Open the image using PIL (Python Imaging Library)
            img = Image.open(image_stream)

            # Optionally, display or save the image
            #img.show()  # Display the image using the default viewer
            img.save(path)
            #Grab Image name
            #pic_filename = secure_filename(file.filename)
            #Set uuid
            #pic_name = str(uuid.uuid1()) + '_' + pic_filename
            #file.save(os.path.join(app.config['UPLOAD_FOLDER'], pic_name))
            # load model
            model = load_model('Jarvis2.h5')
            
            # summarize model.
            model.summary()
            try:
                    with open(f'{time}.jpeg', 'rb') as img_file:
                        img = Image.open(io.BytesIO(img_file.read()))
                        image = img.resize((28, 28))
                        img = np.array(image)

                        # Reshape the array if needed
                        #img = img.reshape(-1, 28, 28, 3)  # Uncomment this line if needed

                        '''# Display the image
                                    plt.imshow(img)
                                    plt.axis('off')  # Turn off axis labels
                                    plt.show()'''

                                    # Rest of your code
                        img = np.array(image).reshape(-1, 28, 28, 3)
                        result = model.predict(img)
                        print(result[0])
                        result = result.tolist()
                        max_prob = max(result[0])
                        class_ind = result[0].index(max_prob)
                        # Convert the image to a NumPy array
                        return jsonify({'prediction':f'{classes[class_ind]}'})
                        #return render_template_string (f'''
                #<h1><img src="{{{{ url_for('static', filename='decode/{time}.jpeg') }}}}"></h1>
                #<h2>{{{{ classes[{class_ind}] }}}}</h2>''', classes=classes, class_ind=class_ind, time=time)
                
            except Exception as e:
                return render_template_string(f"<h1>Please Upload a Jpeg FIle <br/> <i>{e}</i></h1>")
        else:
            return render_template('ome.html')

if __name__ == '__main__':
    app.run(debug=True, port=7000)