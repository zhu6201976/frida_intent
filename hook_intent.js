/**
 * @Time : 2023/6/28 22:00
 * @Author : Tesla
 * @Csdn : https://blog.csdn.net/zhu6201976
 *
 * Frida遍历启动App所有Activity/Service
 * attach模式:
 *     frida -UF -l hook_intent.js
 * spawn模式:
 *     frida -U -l hook_intent.js -f com.mosheng
 */

var context = null;
var packageName = null;
var delay = 1500;

function getContextPackageNameV1() {
    Java.choose('android.app.ActivityThread', {
        onMatch(instance) {
            const currentApplication = instance.currentApplication();
            context = currentApplication.getApplicationContext();
            packageName = context.getPackageName();
            console.log('getContextPackageNameV1', 'context', context, 'packageName', packageName);
        }, onComplete() {
        }
    });
}

function getContextPackageNameV2() {
    const ActivityThread = Java.use("android.app.ActivityThread");
    const currentApplication = ActivityThread.currentApplication();
    context = currentApplication.getApplicationContext();
    packageName = context.getPackageName();
    console.log('getContextPackageNameV2', 'context', context, 'packageName', packageName);
}

function sleep(delay) {
    const start = (new Date()).getTime();
    while ((new Date()).getTime() - start < delay) {
    }
}

/*
public void getAllActivity() {
    PackageManager packageManager = getPackageManager();
    PackageInfo packageInfo = null;
    try {
        packageInfo = packageManager.getPackageInfo(getPackageName(), PackageManager.GET_ACTIVITIES);
        ActivityInfo[] activities = packageInfo.activities;
        for (ActivityInfo activity :activities ) {
            Class<?> aClass = Class.forName(activity.name);
        }
    } catch (PackageManager.NameNotFoundException | ClassNotFoundException e) {
        e.printStackTrace();
    }
}
 */
function getActivities() {
    const packageManager = Java.use("android.content.pm.PackageManager");
    const GET_ACTIVITIES = packageManager.GET_ACTIVITIES.value;
    return Array.prototype.concat(context.getPackageManager()
        .getPackageInfo(context.getPackageName(), GET_ACTIVITIES).activities.value.map((activityInfo) => {
            const activity = activityInfo.name.value;
            // return activity;  // 返回所有Activity
            if (activity.indexOf(packageName) !== -1) {  // 返回app自定义Activity
                return activity;
            }
        }));
}

/*
Intent intent = new Intent(MyActivity.this, MyOtherActivity.class);
intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
startActivity(intent);
 */
function startActivities() {
    const activities = getActivities();
    const set = new Set();
    activities.forEach(function (activity) {
        set.add(activity);
    });
    console.log('getActivities Found ' + set.size + ' activities');

    set.forEach(function (activity) {
        console.log('getActivities start_activity', activity);
        try {
            const Clazz = Java.use(activity);
            const Intent = Java.use('android.content.Intent');
            const intent = Intent.$new(context, Clazz.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK.value);
            context.startActivity(intent);
        } catch (e) {
            console.log('getActivities', e);
        }

        sleep(delay);
    });
}

function getServices() {
    const activityThread = Java.use("android.app.ActivityThread");
    const arrayMap = Java.use("android.util.ArrayMap");
    const packageManager = Java.use("android.content.pm.PackageManager");
    const GET_SERVICES = packageManager.GET_SERVICES.value;
    const currentApplication = activityThread.currentApplication();
    let services = [];
    currentApplication.mLoadedApk.value.mServices.value.values().toArray().map((potentialServices) => {
        Java.cast(potentialServices, arrayMap).keySet().toArray().map((service) => {
            // services.push(service.$className);
            if (service.$className.indexOf(packageName) !== -1) {
                // console.log('getServices 1', service);
                services.push(service.$className);
            }
        });
    });
    services = services.concat(context.getPackageManager()
        .getPackageInfo(context.getPackageName(), GET_SERVICES).services.value.map((activityInfo) => {
            const service = activityInfo.name.value;
            if (service.indexOf(packageName) !== -1) {
                // console.log('getServices 2', service);
                return service;
            }
        }));
    return services;
}

/*
Intent intent = new Intent(this, TestService.class);
startService(intent);
stopService(intent);
 */
function startServices() {
    const services = getServices();
    const set = new Set();
    services.forEach(function (service) {
        set.add(service);
    });
    console.log('startServices Found ' + set.size + ' services');

    set.forEach(function (service) {
        console.log('startServices start_service', service);
        try {
            const Clazz = Java.use(service);
            const Intent = Java.use('android.content.Intent');
            const intent = Intent.$new(context, Clazz.class);
            // context.stopService(intent);
            context.startService(intent);
        } catch (e) {
            console.log('startServices', e);
        }

        sleep(delay);
    });
}

function main() {
    Java.perform(function () {
        try {
            getContextPackageNameV1();
        } catch (e) {
            getContextPackageNameV2();
        }
        startActivities();
        startServices();
    });
}

setTimeout(main, 1500);
