# alt-mm

This program reads a Metamath (.mm) file, and groups and lists identical assertions (axioms, definitions, proofs).

# Install and run

Assuming you already have git and nodejs installed

    git clone https://github.com/Antony74/alt-mm.git
    cd alt-mm
    npm install

Obtain a .mm file from somewhere

    curl https://raw.githubusercontent.com/metamath/set.mm/develop/set.mm -o set.mm

Start the program, specifying the filename

    npm start set.mm

