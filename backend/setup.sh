#!/bin/bash

# Define the folders to navigate into
folders=("speech" "nodeservers" "cancerai")

# Function to run scripts in a folder concurrently
run_scripts_in_folder() {
    local folder="$1"
    cd "$folder" || exit

    # Check if there are any .sh files and execute them in background
    sh_files=$(find . -maxdepth 1 -type f -name "*.sh")
    for file in $sh_files
    do
        echo "Running script in $folder: $file"
        chmod +x "$file"  # Ensure the script is executable
        ./"$file" &       # Run script in background
    done

    cd ..
}

# Loop through each folder and run scripts concurrently
for folder in "${folders[@]}"
do
    run_scripts_in_folder "$folder" &
done

wait

echo "All scripts have been started."
