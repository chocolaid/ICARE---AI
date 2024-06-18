#!/bin/bash

# Define the folders to navigate into
folders=("speech" "nodeservers" "cancerai")

# Loop through each folder
for folder in "${folders[@]}"
do
    # Navigate into the folder
    cd "$folder" || exit

    # Check if there are any .sh files and execute them
    sh_files=$(find . -maxdepth 1 -type f -name "*.sh")
    for file in $sh_files
    do
        echo "Running script: $file"
        chmod +x "$file"  # Ensure the script is executable
        ./"$file"         # Execute the script
    done

    # Navigate back to the original directory
    cd ..
done
