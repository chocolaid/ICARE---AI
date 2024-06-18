#!/bin/bash
# >>=====================================================================================<<
# ||                                                                                     ||
# ||                                                                                     ||
# ||                                                                                     ||
# ||                                                                                     ||
# ||                                                                                     ||
# ||         [....     [........  [..        [.       [.......  [.......    [.. ..       ||
# ||       [..    [..  [..     [..   [..    [. ..     [..    [..[..    [..[..    [..     ||
# ||     [..        [..[..    [..          [.  [..    [..    [..[..    [.. [..           ||
# ||     [..        [..[......[..         [..   [..   [.......  [.......     [..         ||
# ||     [..        [..[..    [..        [...... [..  [..       [..             [..      ||
# ||       [..     [.. [..     [..   [..[..       [.. [..       [..       [..    [..     ||
# ||         [....     [........ [.... [..         [..[..       [..         [.. ..       ||
# ||                                                                                     ||
# ||                                                                                     ||
# ||                                                                                     ||
# ||                                                                                     ||
# ||                                                                                     ||
# >>=====================================================================================<<
# Check for Python 3.10 or 3.11
python_version=$(python --version 2>&1 | awk '{print $2}' | cut -d'.' -f1,2)

if [[ "$python_version" == "3.10" || "$python_version" == "3.11" ]]; then
  echo "Python 3.10 or 3.11 is already installed."
else
  echo "Python 3.10 or 3.11 is not installed. Installing..."
  # Install Python 3.10 or 3.11 (replace with your preferred version)
  if [[ "$OSTYPE" == "linux-gnu" || "$OSTYPE" == "darwin" ]]; then
    # Linux or macOS
    sudo apt update && sudo apt install python3.10 -y # Adjust package name as needed for your distribution
  elif [[ "$OSTYPE" == "msys" ]]; then
    # Windows
    echo "Please download Python 3.10 or 3.11 from https://www.python.org/downloads/"
    read -p "Have you downloaded and installed Python? (y/n): " response
    if [[ "$response" == "y" ]]; then
      echo "Continuing installation..."
    else
      echo "Please install Python first and then run this script again."
      exit 1
    fi
  else
    echo "Unsupported operating system. Please install Python manually."
    exit 1
  fi
fi

# Check for pip
if command -v pip >/dev/null 2>&1; then
  echo "pip is already installed."
else
  echo "pip is not installed. Installing..."
  # Install pip based on Python version
  if [[ "$python_version" == "3.10" ]]; then
    sudo apt install python3.10-venv -y
    python3.10 -m venv env
    source env/bin/activate
    pip install --upgrade pip
  elif [[ "$python_version" == "3.11" ]]; then
    sudo apt install python3.11-venv -y
    python3.11 -m venv env
    source env/bin/activate
    pip install --upgrade pip
  fi
fi

# Install required packages
echo "Installing required packages..."
pip install Flask numpy Pillow Flask-WTF tensorflow python-dotenv keras

mkdir -p $UPLOAD_FOLDER  

echo "Dependencies installed successfully."

echo
echo
COLOR_RED=$(tput setaf 1)
COLOR_GREEN=$(tput setaf 2)
COLOR_YELLOW=$(tput setaf 3)
COLOR_BLUE=$(tput setaf 4)
COLOR_MAGENTA=$(tput setaf 5)
COLOR_CYAN=$(tput setaf 6)
COLOR_RESET=$(tput sgr0)

COLORS=($COLOR_RED $COLOR_GREEN $COLOR_YELLOW $COLOR_BLUE $COLOR_MAGENTA $COLOR_CYAN)

get_random_color() {
    local num_colors=${#COLORS[@]}
    local random_index=$(( RANDOM % num_colors ))
    echo -n "${COLORS[random_index]}"
}

clear_console() {
    if [ "$(uname)" == "Darwin" ] || [ "$(uname)" == "Linux" ]; then
        clear
    elif [ "$(uname -s | cut -c 1-10)" == "MINGW32_NT" ] || [ "$(uname -s | cut -c 1-10)" == "MINGW64_NT" ]; then
        cls
    fi
}

reset_color() {
    echo -n "${COLOR_RESET}"
}

clear_console


TEXT=">>=====================================================================================<<
||                                                                                     ||
||                                                                                     ||
||                                                                                     ||
||                                                                                     ||
||                                                                                     ||
||         [....     [........  [..        [.       [.......  [.......    [.. ..       ||
||       [..    [..  [..     [..   [..    [. ..     [..    [..[..    [..[..    [..     ||
||     [..        [..[..    [..          [.  [..    [..    [..[..    [.. [..           ||
||     [..        [..[......[..         [..   [..   [.......  [.......     [..         ||
||     [..        [..[..    [..        [...... [..  [..       [..             [..      ||
||       [..     [.. [..     [..   [..[..       [.. [..       [..       [..    [..     ||
||         [....     [........ [.... [..         [..[..       [..         [.. ..       ||
||                                                                                     ||
||                                                                                     ||
||                                                                                     ||
||                                                                                     ||
||                                                                                     ||
>>=====================================================================================<<
CONTACT:
Email: ebenedict291@gmail.com
Discord: blueflamedraco_
Phone: +2348027329153
"

for (( i=0; i<${#TEXT}; i++ )); do
  random_color=$(get_random_color)
  echo -ne "${random_color}${TEXT:$i:1}${COLOR_RESET}" 
done
echo
echo 
echo "loading..."

sleep 8
echo "Running main.py..."
echo "Made with ♥ By OEC-APPS"
python3 train2.py 
