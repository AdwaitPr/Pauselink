package com.clickretina.pauselink.di

import com.clickretina.pauselink.data.sync.CloudSyncManager
import com.clickretina.pauselink.data.sync.DefaultCloudSyncManager
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class SyncModule {

    @Binds
    @Singleton
    abstract fun bindCloudSyncManager(
        impl: DefaultCloudSyncManager
    ): CloudSyncManager
}
