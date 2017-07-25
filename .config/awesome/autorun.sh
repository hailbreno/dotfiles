#!/usr/bin/env bash

function run {
  if ! pgrep $1 ;
  then
    $@&
    run program polybarlaunch &
  fi
}
