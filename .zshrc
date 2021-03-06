# If you come from bash you might have to change your $PATH.
# export PATH=$HOME/bin:/usr/local/bin:$PATH

export SSH_AUTH_SOCK="$XDG_RUNTIME_DIR/ssh-agent.socket"

export TERM="xterm-256color"

# Path to your oh-my-zsh installation.
export ZSH=/home/breno/.oh-my-zsh

# Deafult editor
export VISUAL="nano"

# Set name of the theme to load. Optionally, if you set this to "random"
# it'll load a random theme each time that oh-my-zsh is loaded.
# See https://github.com/robbyrussell/oh-my-zsh/wiki/Themes
ZSH_THEME="refined"

# Uncomment the following line to use case-sensitive completion.
# CASE_SENSITIVE="true"

# Uncomment the following line to use hyphen-insensitive completion. Case
# sensitive completion must be off. _ and - will be interchangeable.
# HYPHEN_INSENSITIVE="true"

# Uncomment the following line to disable bi-weekly auto-update checks.
# DISABLE_AUTO_UPDATE="true"

# Uncomment the following line to change how often to auto-update (in days).
# export UPDATE_ZSH_DAYS=13

# Uncomment the following line to disable colors in ls.
# DISABLE_LS_COLORS="true"

# Uncomment the following line to disable auto-setting terminal title.
# DISABLE_AUTO_TITLE="true"

# Uncomment the following line to enable command auto-correction.
# ENABLE_CORRECTION="true"

# Uncomment the following line to display red dots whilst waiting for completion.
# COMPLETION_WAITING_DOTS="true"

# Uncomment the following line if you want to disable marking untracked files
# under VCS as dirty. This makes repository status check for large repositories
# much, much faster.
# DISABLE_UNTRACKED_FILES_DIRTY="true"

# Uncomment the following line if you want to change the command execution time
# stamp shown in the history command output.
# The optional three formats: "mm/dd/yyyy"|"dd.mm.yyyy"|"yyyy-mm-dd"
# HIST_STAMPS="mm/dd/yyyy"

# Would you like to use another custom folder than $ZSH/custom?
# ZSH_CUSTOM=/path/to/new-custom-folder

# Which plugins would you like to load? (plugins can be found in ~/.oh-my-zsh/plugins/*)
# Custom plugins may be added to ~/.oh-my-zsh/custom/plugins/
# Example format: plugins=(rails git textmate ruby lighthouse)
# Add wisely, as too many plugins slow down shell startup.
plugins=(git lol)

source $ZSH/oh-my-zsh.sh

# User configuration

# export MANPATH="/usr/local/man:$MANPATH"

# You may need to manually set your language environment
# export LANG=en_US.UTF-8

# Preferred editor for local and remote sessions
# if [[ -n $SSH_CONNECTION ]]; then
#   export EDITOR='vim'
# else
#   export EDITOR='mvim'
# fi

# Compilation flags
# export ARCHFLAGS="-arch x86_64"

# ssh
# export SSH_KEY_PATH="~/.ssh/rsa_id"

# Set personal aliases, overriding those provided by oh-my-zsh libs,
# plugins, and themes. Aliases can be placed here, though oh-my-zsh
# users are encouraged to define aliases within the ZSH_CUSTOM folder.
# For a full list of active aliases, run `alias`.
#
# Example aliases
# alias zshconfig="mate ~/.zshrc"
# alias ohmyzsh="mate ~/.oh-my-zsh"
alias ss="import -window root"
alias comp="g++ -o"
alias mount="sudo mount"
alias umount="sudo umount"
alias yays="yay -Syu"
alias reboot="sudo reboot"
alias shutdown="sudo shutdown now"
alias mountefi="sudo mount /dev/sda2 /boot/efi"
alias wifi="sudo wifi-menu"
alias bl=" sudo tee /sys/class/backlight/intel_backlight/brightness <<< "
alias zshcfg="nano ~/.zshrc"
# alias xev="xev | awk -F'[ )]+' '/^KeyPress/ { a[NR+2] } NR in a { printf "%-3s %s\n", $5, $8 }'"
alias shot="scrot ~/screenshots/%b%d::%H%M%S.png"
alias adb="sudo adb"
alias devices="sudo adb devices"
alias kraken="pacmd set-default-sink 1"
alias torrent="tremc"
alias cp="rsync --progress --size-only --inplace --verbose"
alias wl="wunderline"
alias today="wunderline today"
alias week="wunderline week"
alias past="wunderline overdue"
alias emacs="emacs -nw"
alias zshbuild="source ~/.zshrc"
alias net="ping 8.8.8.8"
alias x="startx"
alias sizof="du -hs"
alias p="pacaur"
alias vim="nvim"
alias pss="pacaur -Ss"
alias pi="pacaur -S"
alias qute="qutebrowser"
alias neo="neofetch --w3m pictures/wallpapers/vintage-guitar.jpg --block_range 0 15"
alias audior="pacmd unload-module module-udev-detect && pacmd load-module module-udev-detect"
alias easyavr="cd ~/bin/EasyAVR && ./easykeymap.sh"
alias dotsave="git commit -a -m \"daily update\" && git push origin master"
eval $(thefuck --alias)
# eval $(ssh-agent -s)

