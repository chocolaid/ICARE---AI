
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
# Get current user's home directory
CURRENT_USER=$(logname)
USER_HOME=$(eval echo ~$CURRENT_USER)

# Function to check if Node version is greater than 20. Reason is because the Node 22 is the latest at the this
# moment and we want to ensure that the user has the latest version installed.

check_node_version() {
    NODE_VERSION=$(node -v)
    NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -c 2)
    if [ "$NODE_MAJOR_VERSION" -ge 2 ]; then
        return 0
    else
        return 1
    fi
}

# Check operating system
OS=$(uname)
if [ "$OS" == "Windows_NT" ]; then
    echo "Windows OS detected. Please download and install Node.js manually from:"
    echo "https://nodejs.org/dist/v22.3.0/node-v22.3.0-x64.msi"
    exit 1
fi

# Install fnm (Fast Node Manager) for the current user
if [ ! -d "$USER_HOME/.local/share/fnm" ]; then
    echo "Installing fnm for user $CURRENT_USER..."
    curl -fsSL https://fnm.vercel.app/install | bash -s -- --install-dir "$USER_HOME/.local/share"
fi

# Set up fnm environment variables
FNM_PATH="$USER_HOME/.local/share/fnm"
if [ -d "$FNM_PATH" ]; then
    export PATH="$FNM_PATH:$PATH"
    eval "$(fnm env)"
fi

# Check Node.js version
if check_node_version; then
    echo "Node.js version is greater than 20."
else
    echo "Node.js version is not greater than 20. Installing Node.js v22 using fnm..."

    # Download and install Node.js v22 using fnm
    fnm install 22
    fnm use 22
fi

# Verify Node.js and npm versions
echo "Node.js version: $(node -v)"
echo "npm version: $(npm -v)"

# Install pm2 globally if not already installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing pm2 globally..."
    npm install -g pm2
fi

# Set up pm2 to start on system boot
echo "Setting up pm2 to start on system boot..."
PM2_SETUP_COMMAND=$(pm2 startup systemd -u $CURRENT_USER --hp $USER_HOME)
sudo env PATH=$PATH:$FNM_PATH/node-versions/v22.3.0/installation/bin $PM2_SETUP_COMMAND

# Run npm install and start servers with pm2
echo "Installing dependencies and starting servers..."
for dir in whapi smsapi; do
    cd "$dir"
    echo "Installing dependencies for $dir..."
    npm install
    echo "Starting $dir server with pm2..."
    pm2 start index.js --name "$dir"
    cd ..
done
echo "Servers started successfully!"
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
echo "Showing pm2 logs..."
echo "Made with ♥ By OEC-APPS"
pm2 logs
