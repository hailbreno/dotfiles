setxkbmap br
sh ~/.fehbg &
dunst &
compton --config ~/.config/compton/compton.conf &
sudo mount -w /dev/sda4 /mnt/windrive
udiskie &
transmission-daemon
exec i3
