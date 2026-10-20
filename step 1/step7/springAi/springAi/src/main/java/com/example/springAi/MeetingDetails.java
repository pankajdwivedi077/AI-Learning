package com.example.springAi;

public class MeetingDetails {

    private String title;
    private String attendee;
    private String date;
    private String time;
    private Integer durationMinutes;

    public MeetingDetails(){

    }

    public MeetingDetails(String title, String attendee, String date, String time,
                          Integer durationMinutes) {
        this.title = title;
        this.attendee = attendee;
        this.date = date;
        this.time = time;
        this.durationMinutes = durationMinutes;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getAttendee() {
        return attendee;
    }

    public void setAttendee(String attendee) {
        this.attendee = attendee;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getTime() {
        return time;
    }

    public void setTime(String time) {
        this.time = time;
    }

    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
    }
}
