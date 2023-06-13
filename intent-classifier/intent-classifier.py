import pandas as pd
import nltk
import sys
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
import joblib  # Import joblib for saving the model
import json

import os
import sys

def train_model():
    filename = 'buy_sell_dataset.csv'
    if not os.path.isfile(filename):
        print(f"Error: '{filename}' file not found.")
        sys.exit(1)

    nltk.download('punkt', quiet=True)
    nltk.download('wordnet',quiet=True)
    nltk.download('stopwords',quiet=True)

    # Load the data
    data = pd.read_csv('buy_sell_dataset.csv')

    # Remove unnecessary characters
    data['message'] = data['message'].str.replace('[^\w\s]','')

    # Convert to lowercase
    data['message'] = data['message'].str.lower()

    # Tokenization
    data['tokens'] = data['message'].apply(word_tokenize)

    # Remove stop words
    stop_words = set(stopwords.words('english'))
    data['tokens'] = data['tokens'].apply(lambda x: [item for item in x if item not in stop_words])

    # Lemmatization
    lemmatizer = WordNetLemmatizer()
    data['tokens'] = data['tokens'].apply(lambda x: [lemmatizer.lemmatize(item) for item in x])

    # Encoding Labels
    data['intent'] = data['intent'].map({'buy': 1, 'sell': 0, 'nothing': 2})

    # Check for missing values in 'intent' column
    null_values = data['intent'].isnull()
    if null_values.any():
        # print("The following rows have missing 'intent' values:")
        # print(data[null_values])
        # Impute missing values with most frequent value
        data['intent'].fillna(data['intent'].mode()[0], inplace=True)
    # else:
        # print("No missing values found in 'intent' column.")



    # Split the data into training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(data['message'], data['intent'], test_size=0.02)

    # Vectorize the data
    vectorizer = TfidfVectorizer()
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)

    # Train the model
    clf = LogisticRegression()
    clf.fit(X_train_vec, y_train)

    # Evaluate the model
    accuracy = clf.score(X_test_vec, y_test)
    # print(f"Accuracy: {accuracy}")
    # Save the trained model to disk
    import joblib
    joblib.dump(clf, 'model.pkl')

    # Save the vectorizer to disk
    joblib.dump(vectorizer, 'vectorizer.pkl')

    return [clf, vectorizer]

def get_prediction():
    # filenames = ['model.pkl', 'vectorizer.pkl']
    # for filename in filenames:
    #     if not os.path.isfile(filename):
    #         print(f"Error: '{filename}' file not found. Train the model first.")
    #         sys.exit(1)
    # Load the trained model and vectorizer
    clf = 0
    vectorizer = 0
    try:
        clf = joblib.load('model.pkl')
        vectorizer = joblib.load('vectorizer.pkl')
    except:
        training = train_model()
        clf = training[0]
        vectorizer = training[1]

    # Load the messages from input file
    messages = []
    with open(sys.argv[2], 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            line = line.strip()
            messages.append(line)
        
    # Vectorize the message
    message_vec = vectorizer.transform(messages)

    # Predict the intent
    predictions = clf.predict(message_vec)

    output = []

    # Print the results
    for prediction in predictions:
        if prediction == 1:
            output.append("Buy")
        elif prediction == 0:
            output.append('Sell')
        else:
            output.append("Nothing")

    print(output)


if __name__ == '__main__':
    if sys.argv[1] == 'train':
        train_model()
    elif sys.argv[1] == 'predict':
        get_prediction()
    else:
        print("Invalid argument. Please use 'train' or 'predict'.")