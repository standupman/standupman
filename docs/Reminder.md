# Reminder System
A system that sends out reminders to users based on the standup they have subscribed to.

## Description
As users create the standups, they can also schedule reminders to remind their subscribers to post their standup notes. In a single standup, only up to __3 reminders__ can be scheduled. Additionally, users can specify the __days__ `(Mon - 1, Tue - 2, Wed - 3, Thur - 4, Fri - 5, Sat - 6, Sun - 7)` they want to receive the reminders.
The subscribers will receive these reminders according to their preferred notification destination, e.g., slack or email.

## How it works
> Example of a stored reminders data in a standup
```JSON
{
    "...": ...,

    "reminders": {
        "days": [1, 2, 3, 5],
        "schedules": [
            {
                "_id": "625927e2502b0b3ebf9888ba",
                "time": { "hour": 4, "min": 45 },
                "notification_time": "2022-04-15T20:45:00.000Z"
            },
            {
                "_id": "625927e2502b0b3ebf9888bb",
                "time": { "hour": 5, "min": 0 },
                "notification_time": "2022-04-15T21:00:00.000Z"
            }
        ]
    }
}
```

### Sending reminders with a cron job
1. Reminders are sent through running a cron job
2. The cron job runs every 3 minutes to query for any standups that have reminders due to be sent out
    - The query filter to check is - on any notification_time less than the current UTC DateTime
    - The notification_time field is indexed
3. If there are any standups with reminders to be sent, they will be dealt with as a batch
    - It will go through each standup and query all the subscribers (users) associated with that standup to send the reminder.
    - It will loop through all the reminders in standup to see which reminder notification_time is lesser than the current UTC DateTime.
    - Afterwhich, it will check if today is a day to send the reminder. In the example above, the `days` field contains `1`, `2`, `3`, and `5`. It means that sending reminders out is only considered on __Monday, Tuesday, Wednesday, and Friday__.
    - If all checks pass, it will send out reminders for each subscriber. Each subscriber will receive the reminder through the notification destination `(slack, email, etc.)` they prefer to receive.
    - After sending all the reminders to all subscribers, it will update the notification_time field by adding a day.

<hr>

### Creating a standup with reminders
1. Payload will be sent from the client browser
2. The generation of the reminders notification_time will be based on the timing hours and minutes and at the specific timezone provided 
3. The generated time from part (2) is converted to UTC `(as ISO 8601 format)` for storage

<hr>

### Updating a standup with reminders
1. Payload will be sent from the client browser
2. If the update payload contains reminders, it will be checked against the existing ones
    - It will first check if the reminder hour and minute already exist. If true, it will then check if the reminder time scheduled is the same.
    > - A new reminder time will be generated with the same hour and minute time in that timezone.
    > - As the user might retain the same reminder hour and minute, however, change the timezone of what the reminder time should follow. Therefore, it is necessary to check if the newly generated time matches the existing one.
    > - If the reminder time is different, it is replaced with the newly generated one. This replaced reminder will occur starting the next day. This is to prevent duplicated reminders to be sent out upon updating the standup.
    > - For instance;
    > ```JSON
    > // A standup has a reminder at 9:45 a.m., and the current date is at 15 April
    > {
    >    "...": ...,
    >
    >    "reminders": {
    >        "days": [1, 2, 3, 5],
    >        "schedules": [
    >            {
    >                "_id": "625927e2502b0b3ebf9888b9",
    >                "time": { "hour": 9, "min": 45 },
    >                "notification_time": "2022-04-15T20:45:00.000Z"
    >            }
    >        ]
    >    }
    > }
    >```
    >
    >`User updates the standup with the same reminder time, however, select the timezone to be 'America/Chicago'. The generated time to check against the existing notification_time will be "2022-04-16T14:45:00.000Z".`\
    >`The generated time (20:45:00) is different from the current existing time (14:45:00). This means that the previous timezone used to generate the notification_time is different than the current one. The notification_time will be updated with the newly generated time as shown below.`
    >
    >```JSON
    > // The reminder at 9:45 a.m., will be updated and occur the next day 16 April at 14:45 UTC
    > {
    >    "...": ...,
    >
    >    "reminders": {
    >        "days": [1, 2, 3, 5],
    >        "schedules": [
    >            {
    >                "_id": "625927e2502b0b3ebf9888b9",
    >                "time": { "hour": 9, "min": 45 },
    >                "notification_time": "2022-04-16T14:45:00.000Z"
    >            }
    >        ]
    >    }
    > }
    >```
    > - However, if the newly generated time is the same as the existing one, it will just retain the existing reminder.
    - Otherwise, if false, it will use the new reminder hour and minute to generate a reminder time.

## Development
If a new `notification_destination` type is added please add it under [here](../lib/) and add the check [here](../Jobs/Reminder.js#L31).