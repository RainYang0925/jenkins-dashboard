# fabfile.py: Used in MissionControl for placement deploys
from prezi.fabric.placement import CommonTasks, PlacementDeploy

tasks = CommonTasks(PlacementDeploy(egg_name='Jenkins Dashboard'), 'Jenkins Dashboard', {}, '/')


def Jenkins Dashboard(*args, **kwargs):
    tasks.deploy(*args, **kwargs)