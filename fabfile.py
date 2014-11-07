# fabfile.py: Used in MissionControl for placement deploys
from prezi.fabric.placement import CommonTasks, PlacementDeploy

tasks = CommonTasks(PlacementDeploy(egg_name='jenkinsdashboard'), 'jenkinsdashboard', {}, '/')


def jenkinsdashboard(*args, **kwargs):
    tasks.deploy(*args, **kwargs)