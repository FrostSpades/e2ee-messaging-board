"""
Entrypoint to the application.

@author Ethan Andrews
@version 2024.7.14
"""

from app import create_app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True, port=80)
