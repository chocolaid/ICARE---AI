#!/bin/bash

# Define the folders to navigate into
folders=("speech" "nodeservers" "cancerai", "webcancer.ai")

# Function to run scripts in a folder concurrently
run_scripts_in_folder() {
    local folder="$1"
    if cd "$folder"; then
        # Check if there are any .sh files and execute them in background
        sh_files=$(find . -maxdepth 1 -type f -name "*.sh")
        if [ -z "$sh_files" ]; then
            echo "No .sh files found in $folder"
        else
            for file in $sh_files
            do
                echo "Running script in $folder: $file"
                chmod +x "$file"  # Ensure the script is executable
                ./"$file" &       # Run script in background
                pid=$!
                echo "Started $file with PID $pid"
            done
        fi
        cd - > /dev/null || exit
    else
        echo "Failed to navigate to folder: $folder"
    fi
}

# Loop through each folder and run scripts concurrently
for folder in "${folders[@]}"
do
    run_scripts_in_folder "$folder"
done

wait

echo "All scripts have been started."
